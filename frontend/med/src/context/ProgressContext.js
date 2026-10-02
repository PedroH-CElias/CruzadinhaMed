/**
 * Contexto de progresso nas cruzadinhas.
 *
 * Funciona "primeiro no aparelho, depois na nuvem":
 * 1. Toda alteração é salva no aparelho (AsyncStorage), logado ou convidado.
 *    Assim o jogo funciona sem internet.
 * 2. Se o usuário estiver logado, as cruzadinhas alteradas ficam marcadas como
 *    pendentes ("dirty") e são enviadas ao backend (PUT /progress) alguns segundos depois.
 *    Sem conexão, continuam pendentes e são enviadas na próxima oportunidade
 *    (ao abrir o app, ao voltar para ele ou na próxima alteração).
 * 3. Ao ENTRAR numa conta, o progresso feito como convidado é levado para a conta.
 * 4. Ao SAIR da conta, o pendente é enviado e a cópia local daquela conta é apagada.
 *    (Se a sessão apenas expirar, a cópia local é mantida para não perder nada.)
 *
 * Uso nas telas: const { progress, saveProgress } = useProgress();
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import * as api from '../services/api';
import {
  GUEST_OWNER,
  ownerForUser,
  loadProgressStore,
  saveProgressStore,
  clearProgressStore,
  mergeRecords,
} from '../services/progressStorage';

/** Espera depois da última alteração para gravar no aparelho (evita gravar a cada letra). */
const LOCAL_SAVE_DELAY_MS = 400;

/** Espera depois da última alteração para enviar ao servidor. */
const SYNC_DELAY_MS = 3000;

/** Tempo máximo esperando o envio do pendente ao sair da conta. */
const SIGN_OUT_SYNC_TIMEOUT_MS = 5000;

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { status, user, registerSessionEndHandler } = useAuth();

  // Estado exibido nas telas
  const [progress, setProgress] = useState({});
  const [ready, setReady] = useState(false);

  // Espelhos síncronos (usados dentro de timers e funções assíncronas)
  const ownerRef = useRef(null); // dono atual: 'guest' ou 'user-<id>'
  const itemsRef = useRef({}); // mesmo conteúdo de `progress`
  const dirtyRef = useRef(new Set()); // ids alterados e ainda não enviados
  const saveTimer = useRef(null);
  const syncTimer = useRef(null);
  const syncPromise = useRef(null); // envio em andamento (evita dois envios simultâneos)

  /** Atualiza o progresso em memória (estado + espelho). */
  const commit = useCallback((next) => {
    itemsRef.current = next;
    setProgress(next);
  }, []);

  /** Grava agora no aparelho o progresso do dono atual. */
  const persistNow = useCallback(async () => {
    clearTimeout(saveTimer.current);
    const owner = ownerRef.current;
    if (!owner) return;
    try {
      await saveProgressStore(owner, { items: itemsRef.current, dirty: dirtyRef.current });
    } catch {
      // Falha rara de armazenamento: o progresso continua em memória e será gravado na próxima alteração
    }
  }, []);

  /** Agenda a gravação no aparelho. */
  const schedulePersist = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistNow, LOCAL_SAVE_DELAY_MS);
  }, [persistNow]);

  /**
   * Envia ao servidor o que está pendente e junta a resposta com o que está no aparelho.
   * Sem pendências, apenas baixa o progresso do servidor (ex.: jogou em outro aparelho).
   */
  const syncNow = useCallback(() => {
    const owner = ownerRef.current;
    if (!owner || owner === GUEST_OWNER) return Promise.resolve();
    if (syncPromise.current) return syncPromise.current;

    syncPromise.current = (async () => {
      clearTimeout(syncTimer.current);

      // Fotografia do que será enviado (o usuário pode continuar jogando durante o envio)
      const ids = [...dirtyRef.current];
      const sent = ids.map((id) => itemsRef.current[id]).filter(Boolean);
      const sentVersion = Object.fromEntries(sent.map((r) => [r.puzzleId, r.updatedAt]));

      const serverList = sent.length ? await api.syncProgress(sent) : await api.getProgress();
      if (ownerRef.current !== owner) return; // trocou de conta durante o envio: descarta

      // Só deixa de ser pendente o que não mudou desde o envio
      ids.forEach((id) => {
        if (itemsRef.current[id]?.updatedAt === sentVersion[id]) dirtyRef.current.delete(id);
      });

      const next = { ...itemsRef.current };
      serverList.forEach((remote) => {
        next[remote.puzzleId] = mergeRecords(next[remote.puzzleId], remote);
      });
      commit(next);
      await persistNow();
    })()
      .catch(() => {
        // Sem conexão ou servidor fora do ar: os itens continuam pendentes para a próxima vez
      })
      .finally(() => {
        syncPromise.current = null;
      });

    return syncPromise.current;
  }, [commit, persistNow]);

  /** Agenda o envio ao servidor (somente logado). */
  const scheduleSync = useCallback(() => {
    if (!ownerRef.current || ownerRef.current === GUEST_OWNER) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(syncNow, SYNC_DELAY_MS);
  }, [syncNow]);

  // Troca de dono quando o usuário entra, sai ou a sessão expira
  useEffect(() => {
    if (status === 'loading') return undefined;
    const nextOwner = status === 'authenticated' && user ? ownerForUser(user) : GUEST_OWNER;
    if (ownerRef.current === nextOwner) return undefined;

    let cancelled = false;
    (async () => {
      // Garante que o progresso do dono anterior esteja gravado antes de trocar
      await persistNow();
      clearTimeout(syncTimer.current);

      const store = await loadProgressStore(nextOwner);

      // Entrou numa conta: leva o progresso feito como convidado para ela
      if (nextOwner !== GUEST_OWNER) {
        const guest = await loadProgressStore(GUEST_OWNER);
        const guestIds = Object.keys(guest.items);
        guestIds.forEach((id) => {
          store.items[id] = mergeRecords(store.items[id], guest.items[id]);
          store.dirty.add(id);
        });
        if (guestIds.length) await clearProgressStore(GUEST_OWNER);
      }

      if (cancelled) return;
      ownerRef.current = nextOwner;
      dirtyRef.current = store.dirty;
      commit(store.items);
      setReady(true);

      if (nextOwner !== GUEST_OWNER) {
        await persistNow();
        syncNow(); // envia o pendente e baixa o que veio de outros aparelhos
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, user, commit, persistNow, syncNow]);

  // Ao sair da conta (ou excluí-la): envia o pendente e apaga a cópia local da conta
  useEffect(() => {
    return registerSessionEndHandler(async (reason) => {
      const owner = ownerRef.current;
      if (!owner || owner === GUEST_OWNER) return;

      if (reason === 'signout' && dirtyRef.current.size > 0) {
        await Promise.race([syncNow(), new Promise((r) => setTimeout(r, SIGN_OUT_SYNC_TIMEOUT_MS))]);
      }

      clearTimeout(saveTimer.current);
      clearTimeout(syncTimer.current);
      ownerRef.current = null; // impede gravações atrasadas na conta que está saindo
      await clearProgressStore(owner).catch(() => {});
      dirtyRef.current = new Set();
      commit({});
    });
  }, [registerSessionEndHandler, syncNow, commit]);

  // Ao voltar para o app: tenta enviar o que ficou pendente
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && dirtyRef.current.size > 0) syncNow();
    });
    return () => subscription.remove();
  }, [syncNow]);

  /**
   * Salva o progresso de uma cruzadinha. Recebe só os campos que mudaram:
   * { cells, solvedWords, totalWords, hintsUsed, completed }.
   * "completed" nunca volta a false depois de concluída.
   */
  const saveProgress = useCallback(
    (puzzleId, changes) => {
      if (!ownerRef.current) return;
      const previous = itemsRef.current[puzzleId];
      const now = Date.now();
      const completedNow = !!changes.completed;

      const record = {
        puzzleId,
        cells: changes.cells ?? previous?.cells ?? {},
        solvedWords: changes.solvedWords ?? previous?.solvedWords ?? 0,
        totalWords: changes.totalWords ?? previous?.totalWords ?? 0,
        hintsUsed: changes.hintsUsed ?? previous?.hintsUsed ?? 0,
        completed: !!previous?.completed || completedNow,
        completedAt: previous?.completedAt ?? (completedNow ? now : null),
        // Sempre maior que a versão anterior, mesmo com duas alterações no mesmo milissegundo
        updatedAt: Math.max(now, (previous?.updatedAt ?? 0) + 1),
      };

      commit({ ...itemsRef.current, [puzzleId]: record });
      dirtyRef.current.add(puzzleId);
      schedulePersist();
      scheduleSync();
    },
    [commit, schedulePersist, scheduleSync]
  );

  const value = useMemo(
    () => ({ ready, progress, saveProgress, syncNow }),
    [ready, progress, saveProgress, syncNow]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** Acessa o progresso. Deve ser usado dentro do ProgressProvider. */
export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress precisa ser usado dentro de <ProgressProvider>');
  }
  return context;
}
