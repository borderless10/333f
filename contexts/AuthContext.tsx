import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { buscarPerfilUsuario, type UserRole } from '@/lib/services/profiles';

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

  /**
   * Carrega o perfil/role do usuário
   */
  const loadUserRole = async (uid: string) => {
    try {
      setRoleLoading(true);
      const { data: perfil, error } = await buscarPerfilUsuario(uid);
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        setUserRole(null);
        setRoleLoading(false);
        return;
      }
      
      setUserRole(perfil?.role || null);
      setRoleLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
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
   * Verifica se há sessão ativa ao carregar o app
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao buscar sessão:', error);
          setLoading(false);
          setRoleLoading(false);
          return;
        }
        
        setUser(session?.user ?? null);
        setUserId(session?.user?.id ?? null);
        
        if (session?.user?.id) {
          await loadUserRole(session.user.id);
        } else {
          setRoleLoading(false);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao inicializar auth:', err);
        setUser(null);
        setUserId(null);
        setUserRole(null);
        setLoading(false);
        setRoleLoading(false);
      }
    };

    initAuth();

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      
      if (session?.user?.id) {
        await loadUserRole(session.user.id);
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      setUserId(data.user.id);
      await loadUserRole(data.user.id);
    }
  };

  /**
   * Faz logout
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setUser(null);
    setUserId(null);
    setUserRole(null);
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
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
