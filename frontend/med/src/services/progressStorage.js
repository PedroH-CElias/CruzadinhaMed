/**
 * Armazenamento LOCAL do progresso nas cruzadinhas (no próprio aparelho).
 *
 * O progresso é salvo separado por "dono":
 * - 'guest'       → modo convidado;
 * - 'user-<id>'   → cada conta que já entrou neste aparelho.
 * Assim, contas diferentes no mesmo celular não misturam progresso.
 *
 * Formato salvo para cada dono (JSON no AsyncStorage):
 * {
 *   items: { [puzzleId]: ProgressRecord },
 *   dirty: [puzzleId, ...]   // alterados no aparelho e ainda não enviados ao servidor
 * }
 *
 * ProgressRecord:
 * {
 *   puzzleId:    'anatomia-facil-1',
 *   cells:       { '0-10': 'U', ... },  // letras preenchidas ("linha-coluna": letra)
 *   solvedWords: 3,                     // palavras certas
 *   totalWords:  8,
 *   hintsUsed:   1,
 *   completed:   false,                 // já foi concluída alguma vez (nunca volta a false)
 *   completedAt: null | 1790000000000,  // primeira conclusão (ms)
 *   updatedAt:   1790000000000,         // última alteração (ms)
 * }
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'cruzadinhamed.progress.';

/** Dono do progresso no modo convidado. */
export const GUEST_OWNER = 'guest';

/** Dono do progresso de uma conta. */
export const ownerForUser = (user) => `user-${user.id}`;

const keyFor = (owner) => `${KEY_PREFIX}${owner}`;

/** Carrega o progresso salvo de um dono. Nunca falha: em caso de erro devolve vazio. */
export async function loadProgressStore(owner) {
  try {
    const raw = await AsyncStorage.getItem(keyFor(owner));
    if (!raw) return { items: {}, dirty: new Set() };
    const data = JSON.parse(raw);
    return { items: data.items ?? {}, dirty: new Set(data.dirty ?? []) };
  } catch {
    return { items: {}, dirty: new Set() };
  }
}

/** Salva o progresso de um dono. */
export async function saveProgressStore(owner, { items, dirty }) {
  await AsyncStorage.setItem(keyFor(owner), JSON.stringify({ items, dirty: [...dirty] }));
}

/** Apaga o progresso local de um dono (ex.: ao sair da conta). */
export async function clearProgressStore(owner) {
  await AsyncStorage.removeItem(keyFor(owner));
}

/**
 * Junta duas versões do progresso da MESMA cruzadinha (ex.: a do aparelho e a do servidor).
 * Mesmas regras do backend (ProgressService):
 * - letras, palavras certas e dicas: vale a versão com updatedAt mais recente;
 * - concluída: se qualquer uma foi concluída, o resultado é concluído, com a data
 *   de conclusão mais antiga.
 */
export function mergeRecords(a, b) {
  if (!a) return b;
  if (!b) return a;

  const newer = (b.updatedAt ?? 0) > (a.updatedAt ?? 0) ? b : a;
  const completionDates = [a, b]
    .filter((r) => r.completed && r.completedAt)
    .map((r) => r.completedAt);

  return {
    ...newer,
    completed: !!(a.completed || b.completed),
    completedAt: completionDates.length ? Math.min(...completionDates) : null,
  };
}
