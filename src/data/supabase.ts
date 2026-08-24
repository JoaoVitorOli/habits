import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

/**
 * A conta e opcional: sem as chaves no `.env` o app inteiro continua de pe e o cartao de
 * sync em Ajustes so avisa que esta desligado. Nada aqui e importado por tela de dados.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // nao ha URL de retorno num app: o token chega pelo Google, nao pelo navegador
          detectSessionInUrl: false,
        },
      })
    : null;

export const syncConfigured = supabase !== null && Boolean(googleWebClientId);

/** `null` quando o usuario fecha o dialogo do Google: desistir nao e erro. */
export async function signInWithGoogle(): Promise<Session | null> {
  if (supabase === null || !googleWebClientId) {
    throw new Error('Sync desligado: faltam as chaves no .env.');
  }

  GoogleSignin.configure({ webClientId: googleWebClientId });
  await GoogleSignin.hasPlayServices();

  const response = await GoogleSignin.signIn();
  if (response.type !== 'success' || response.data.idToken === null) return null;

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.data.idToken,
  });

  if (error) throw error;

  return data.session;
}

export async function signOutFromGoogle(): Promise<void> {
  if (supabase === null) return;

  await GoogleSignin.signOut().catch(() => {});
  await supabase.auth.signOut();
}
