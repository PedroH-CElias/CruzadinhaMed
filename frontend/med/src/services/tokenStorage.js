/**
 * Armazenamento persistente do refresh token.
 *
 * - Celular (Android/iOS): usa o expo-secure-store, que grava no Keystore (Android)
 *   ou no Keychain (iOS). O token fica criptografado pelo próprio sistema operacional.
 * - Web: o SecureStore não existe no navegador, então usamos o localStorage
 *   (menos seguro; serve apenas para testes no navegador).
 *
 * Só o refresh token é salvo. O token de acesso fica apenas na memória (ver api.js),
 * porque ele dura poucos minutos e é renovado a partir do refresh token.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'cruzadinhamed.refreshToken';
const isWeb = Platform.OS === 'web';

/** Lê o refresh token salvo. Retorna null se não houver sessão salva. */
export async function getRefreshToken() {
  if (isWeb) {
    try {
      return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/** Salva (ou substitui) o refresh token da sessão atual. */
export async function setRefreshToken(token) {
  if (isWeb) {
    try {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // Navegador sem acesso ao storage (ex.: modo privado): a sessão só dura até fechar a aba
    }
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/** Apaga o refresh token (logout ou sessão expirada). */
export async function clearRefreshToken() {
  if (isWeb) {
    try {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // nada a fazer
    }
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
