import { buscarPerfilUsuario, type UserRole } from "@/lib/services/profiles";
import { supabase } from "@/lib/supabase";
import { getCreatingUserFlag } from "@/lib/utils/auth-flag";
import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextData {
  user: User | null;
  userId: string | null;
  userRole: UserRole | null;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  };

  /**
   * Carrega o perfil/role do usuário
   */
  const loadUserRole = async (uid: string) => {
    try {
      setRoleLoading(true);
      const { data: perfil, error } = await withTimeout(
        buscarPerfilUsuario(uid),
        8000,
        "Timeout ao buscar perfil do usuário",
      );

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      setUserRole(perfil?.role || null);
      setRoleLoading(false);
    } catch (error) {
      console.error("Erro ao carregar perfil do usuário:", error);
      setUserRole(null);
      setRoleLoading(false);
    }
  };

  /**
   * Recarrega o perfil do usuário (útil após alterar perfil)
   */
  const refreshUserRole = async () => {
    if (userId) {
      await loadUserRole(userId);
    }
  };

  /**
   * Verifica se há sessão ativa ao carregar o app.
   * Define loading = false assim que a sessão é conhecida, para não travar o app
   * se getSession ou loadUserRole demorarem (rede/Supabase). O role carrega em background.
   */
  useEffect(() => {
    const SESSION_TIMEOUT_MS = 8000;

    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout ao obter sessão")),
            SESSION_TIMEOUT_MS,
          ),
        );
        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) {
          console.error("Erro ao buscar sessão:", error);
          setLoading(false);
          setRoleLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        setUserId(session?.user?.id ?? null);
        setLoading(false); // Libera a tela logo; role pode carregar em background

        if (session?.user?.id) {
          loadUserRole(session.user.id).catch((e) => {
            console.error("Erro ao carregar perfil na inicialização:", e);
            setRoleLoading(false);
          });
        } else {
          setRoleLoading(false);
        }
      } catch (err) {
        console.error("Erro ao inicializar auth:", err);
        setUser(null);
        setUserId(null);
        setUserRole(null);
        setLoading(false);
        setRoleLoading(false);
      }
    };

    initAuth();

    // Escuta mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignora mudanças de sessão durante a criação de usuário
      if (getCreatingUserFlag()) {
        console.log(
          "[AuthContext] Ignorando mudança de sessão durante criação de usuário:",
          event,
        );
        return;
      }

      console.log(
        "[AuthContext] Mudança de autenticação:",
        event,
        session?.user?.id,
      );
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);

      if (session?.user?.id) {
        loadUserRole(session.user.id).catch((roleError) => {
          console.warn(
            "[AuthContext] Falha ao carregar perfil no onAuthStateChange:",
            roleError,
          );
        });
      } else {
        setUserRole(null);
        setRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Faz login
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      12000,
      "Timeout ao realizar login",
    );

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      setUserId(data.user.id);
      loadUserRole(data.user.id).catch((roleError) => {
        console.warn(
          "[AuthContext] Não foi possível carregar perfil após login:",
          roleError,
        );
      });
    }
  };

  /**
   * Faz logout
   */
  const signOut = async () => {
    const SIGNOUT_TIMEOUT_MS = 8000;

    // Limpa estado local primeiro para o app destravar imediatamente
    setUser(null);
    setUserId(null);
    setUserRole(null);
    setRoleLoading(false);

    try {
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
        setTimeout(
          () =>
            resolve({
              error: new Error("Timeout ao encerrar sessão no servidor"),
            }),
          SIGNOUT_TIMEOUT_MS,
        ),
      );

      const result = await Promise.race([signOutPromise, timeoutPromise]);
      if ((result as any)?.error) {
        console.warn(
          "[AuthContext] Logout local concluído, mas logout remoto falhou/expirou:",
          (result as any).error?.message,
        );
      }
    } catch (error) {
      console.warn(
        "[AuthContext] Logout local concluído, erro no logout remoto:",
        error,
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        userRole,
        loading,
        roleLoading,
        signIn,
        signOut,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
