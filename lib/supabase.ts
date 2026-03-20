import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Carrega variáveis de ambiente
// No Expo, variáveis com prefixo EXPO_PUBLIC_ são expostas automaticamente
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Variáveis de ambiente do Supabase não configuradas. Verifique o arquivo .env",
  );
}

/**
 * Storage para o Supabase Auth que funciona em todos os ambientes:
 * - Node (SSR / build web): stub em memória (evita "window is not defined" do AsyncStorage).
 * - Browser / React Native: AsyncStorage (persiste sessão no app e na web).
 */
function getAuthStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} {
  if (typeof window === "undefined") {
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
  return AsyncStorage;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: getAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // OAuth redirect é tratado manualmente no login
  },
});
