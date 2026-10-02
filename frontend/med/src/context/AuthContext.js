/**
 * Contexto de autenticação do app.
 *
 * Mantém o estado da sessão e disponibiliza as ações de login, cadastro e logout
 * para qualquer tela via hook useAuth().
 *
 * Estados possíveis (status):
 * - 'loading':       o app acabou de abrir e está tentando restaurar a sessão salva;
 * - 'guest':         modo convidado (sem conta ou deslogado). O jogo funciona normalmente;
 * - 'authenticated': usuário logado; `user` tem os dados vindos de GET /users/me.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  /**
   * Funções avisadas quando a sessão termina por vontade do usuário (sair ou excluir a conta).
   * Ex.: o ProgressContext envia o progresso pendente e apaga a cópia local da conta.
   */
  const sessionEndHandlers = useRef(new Set());

  /** Registra um aviso de fim de sessão. Devolve a função que cancela o registro. */
  const registerSessionEndHandler = useCallback((handler) => {
    sessionEndHandlers.current.add(handler);
    return () => sessionEndHandlers.current.delete(handler);
  }, []);

  /** Executa os avisos de fim de sessão; falhas neles não impedem sair. */
  const runSessionEndHandlers = useCallback(async (reason) => {
    const handlers = [...sessionEndHandlers.current];
    await Promise.all(handlers.map((handler) => Promise.resolve(handler(reason)).catch(() => {})));
  }, []);

  /** Volta para o modo convidado (usado no logout e quando a sessão expira). */
  const becomeGuest = useCallback(() => {
    setUser(null);
    setStatus('guest');
  }, []);

  /** Carrega o usuário logado e marca a sessão como autenticada. */
  const loadUser = useCallback(async () => {
    const me = await api.getMe();
    setUser(me);
    setStatus('authenticated');
  }, []);

  // Ao abrir o app: registra o aviso de sessão expirada e tenta restaurar a sessão salva
  useEffect(() => {
    api.setSessionExpiredHandler(becomeGuest);

    (async () => {
      try {
        const restored = await api.refreshSession();
        if (restored) {
          await loadUser();
        } else {
          becomeGuest();
        }
      } catch {
        // Sem conexão ao abrir: o jogo funciona offline como convidado. A sessão salva
        // é mantida e será restaurada na próxima vez que o app abrir com internet.
        becomeGuest();
      }
    })();

    return () => api.setSessionExpiredHandler(null);
  }, [becomeGuest, loadUser]);

  /** Login com e-mail e senha. Lança ApiError em caso de falha (a tela mostra a mensagem). */
  const signIn = useCallback(
    async (email, password) => {
      await api.login(email, password);
      await loadUser();
    },
    [loadUser]
  );

  /** Cria a conta e já entra nela. */
  const signUp = useCallback(
    async ({ name, email, password }) => {
      await api.register({ name, email, password });
      await signIn(email, password);
    },
    [signIn]
  );

  /** Sai da conta e volta para o modo convidado. */
  const signOut = useCallback(async () => {
    // Antes de apagar os tokens: dá chance de enviar o que está pendente (ex.: progresso)
    await runSessionEndHandlers('signout');
    await api.logout();
    becomeGuest();
  }, [becomeGuest, runSessionEndHandlers]);

  /** Exclui a conta (confirmando com a senha) e volta para o modo convidado. */
  const deleteAccount = useCallback(
    async (password) => {
      await api.deleteAccount(password);
      await runSessionEndHandlers('delete');
      becomeGuest();
    },
    [becomeGuest, runSessionEndHandlers]
  );

  /** Redefine a senha com o código recebido por e-mail e já entra com a nova senha. */
  const resetPassword = useCallback(
    async ({ email, code, newPassword }) => {
      await api.resetPassword({ email, code, newPassword });
      await signIn(email, newPassword);
    },
    [signIn]
  );

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      signIn,
      signUp,
      signOut,
      deleteAccount,
      resetPassword,
      registerSessionEndHandler,
    }),
    [status, user, signIn, signUp, signOut, deleteAccount, resetPassword, registerSessionEndHandler]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Acessa o estado e as ações de autenticação. Deve ser usado dentro do AuthProvider. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  }
  return context;
}
