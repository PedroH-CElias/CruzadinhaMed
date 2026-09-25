/**
 * Cliente HTTP da API do CruzadinhaMed.
 *
 * Responsabilidades:
 * - descobrir o endereço do backend (ver resolveApiUrl);
 * - fazer login, cadastro, logout e buscar o usuário logado;
 * - guardar o token de acesso em memória e o refresh token no armazenamento seguro;
 * - renovar a sessão automaticamente quando a API responder 401 (token de acesso expirado).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from './tokenStorage';

/** Porta em que o Spring Boot roda. */
const API_PORT = 8080;

/** Tempo máximo de espera de uma requisição, em milissegundos. */
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Define a URL base da API, nesta ordem de prioridade:
 * 1. Variável de ambiente EXPO_PUBLIC_API_URL (ex.: a URL HTTPS de produção).
 * 2. Navegador: http://localhost:8080.
 * 3. Expo Go no celular: usa o mesmo IP do PC que o Expo Go já usa para baixar o app
 *    (Constants.expoConfig.hostUri, ex.: "192.168.0.10:8081"), trocando a porta para 8080.
 */
function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}`;
  }
  const hostUri = Constants.expoConfig?.hostUri; // "IP:porta" do servidor do Expo
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:${API_PORT}`;
}

export const API_URL = resolveApiUrl();

/**
 * Erro padronizado das chamadas à API.
 * status = código HTTP, ou 0 quando não foi possível falar com o servidor (sem rede,
 * servidor desligado, firewall bloqueando, tempo esgotado).
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Estado da sessão (apenas em memória)
// ---------------------------------------------------------------------------

/** Token de acesso atual (JWT). Nunca é gravado em disco. */
let accessToken = null;

/** Renovação em andamento. Garante que chamadas simultâneas usem UMA única renovação. */
let refreshPromise = null;

/** Função chamada quando a sessão acaba de vez (o AuthContext volta para "convidado"). */
let sessionExpiredHandler = null;

/** Registra quem deve ser avisado quando a sessão expirar e não puder ser renovada. */
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
}

/** Guarda o par de tokens recebido do login ou do refresh. */
async function saveTokens(tokens) {
  accessToken = tokens.accessToken;
  await setRefreshToken(tokens.refreshToken);
}

/** Apaga os tokens locais (memória e armazenamento seguro). */
async function clearTokens() {
  accessToken = null;
  await clearRefreshToken();
}

// ---------------------------------------------------------------------------
// Requisições
// ---------------------------------------------------------------------------

/** fetch com limite de tempo. */
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Tenta extrair a mensagem de erro do corpo da resposta do Spring. */
async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body?.message || body?.error || `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
}

/**
 * Faz uma requisição à API.
 *
 * @param {string} path          caminho a partir da raiz da API (ex.: "/users/me")
 * @param {object} options
 * @param {string} options.method  método HTTP (padrão GET)
 * @param {object} options.body    corpo, enviado como JSON
 * @param {boolean} options.auth   envia o token de acesso e renova a sessão se ele expirar
 * @param {boolean} options.retry  uso interno: evita renovar a sessão mais de uma vez
 */
async function request(path, { method = 'GET', body, auth = false, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetchWithTimeout(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.');
  }

  // Token de acesso expirado: renova a sessão uma vez e repete a requisição
  if (response.status === 401 && auth && retry) {
    const renewed = await refreshSession();
    if (renewed) {
      return request(path, { method, body, auth, retry: false });
    }
    sessionExpiredHandler?.();
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------

/**
 * Renova a sessão usando o refresh token salvo.
 *
 * @returns {Promise<boolean>} true se renovou; false se não há sessão salva ou se o
 *          servidor recusou o token (nesse caso os tokens locais são apagados).
 * @throws {ApiError} status 0 quando não há conexão (a sessão salva é mantida para
 *          tentar de novo mais tarde).
 */
export function refreshSession() {
  // Se já existe uma renovação em andamento, reaproveita. Duas renovações com o mesmo
  // token fariam o backend achar que o token foi roubado e encerrar todas as sessões.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      try {
        const tokens = await request('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
        });
        await saveTokens(tokens);
        return true;
      } catch (error) {
        if (error.status === 0) throw error; // sem conexão: mantém a sessão salva
        await clearTokens(); // token recusado pelo servidor: sessão encerrada
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Faz login com e-mail e senha e guarda os tokens da nova sessão. */
export async function login(email, password) {
  const tokens = await request('/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
  await saveTokens(tokens);
}

/** Cria uma nova conta de jogador. Não faz login (ver signUp no AuthContext). */
export function register({ name, email, password }) {
  return request('/users', {
    method: 'POST',
    body: { name: name.trim(), email: email.trim().toLowerCase(), password },
  });
}

/**
 * Encerra a sessão. Os tokens locais são apagados primeiro, então o usuário sai
 * mesmo que o servidor esteja fora do ar.
 */
export async function logout() {
  const refreshToken = await getRefreshToken();
  await clearTokens();
  if (!refreshToken) return;
  try {
    await request('/auth/logout', { method: 'POST', body: { refreshToken } });
  } catch {
    // Falha no servidor não impede o logout local; o token expira sozinho no backend
  }
}

/** Busca os dados do usuário logado (nome, e-mail, perfis...). */
export function getMe() {
  return request('/users/me', { auth: true });
}

// ---------------------------------------------------------------------------
// Mensagens de erro para as telas
// ---------------------------------------------------------------------------

/**
 * Converte um erro da API numa mensagem amigável em português.
 *
 * @param {unknown} error
 * @param {Record<number, string>} byStatus mensagens específicas da tela, por código HTTP
 *        (ex.: { 401: 'E-mail ou senha inválidos.' })
 */
export function getErrorMessage(error, byStatus = {}) {
  if (!(error instanceof ApiError)) {
    return 'Algo deu errado. Tente novamente.';
  }
  if (byStatus[error.status]) return byStatus[error.status];
  if (error.status === 0) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  }
  if (error.status === 400) return 'Verifique os dados informados.';
  if (error.status === 429) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  return 'Algo deu errado. Tente novamente.';
}
