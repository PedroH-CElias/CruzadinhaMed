/**
 * Regras de acesso às cruzadinhas: o que é grátis e o que é Premium.
 *
 * Grátis: o nível 1 de cada dificuldade em todas as categorias
 * (4 categorias x 3 dificuldades = 12 cruzadinhas). O resto exige Premium.
 *
 * ATENÇÃO: esta trava existe só no app. Como todas as cruzadinhas estão dentro do
 * app (puzzles.js), alguém com conhecimento técnico conseguiria acessá-las. Quando o
 * Premium for vendido de verdade, as cruzadinhas pagas devem vir do backend, que só as
 * entrega para quem tem assinatura ativa.
 */

/** Quantos níveis de cada dificuldade são gratuitos (a partir do nível 1). */
export const FREE_LEVELS_PER_DIFFICULTY = 1;

/** Preço exibido nas telas. A cobrança real será feita pela App Store / Google Play. */
export const PREMIUM_PRICE_LABEL = 'R$ 9,99/mês';

/**
 * Libera todas as cruzadinhas durante o DESENVOLVIMENTO, para você testar tudo.
 * Mude para true quando precisar; só tem efeito no Expo Go / modo dev (__DEV__).
 */
const DEV_UNLOCK_ALL = false;

/** A cruzadinha faz parte do acesso grátis? */
export function isPuzzleFree(puzzle) {
  return puzzle.level <= FREE_LEVELS_PER_DIFFICULTY;
}

/**
 * O usuário tem Premium? A assinatura ainda não existe, então hoje é sempre false.
 * Quando existir, o backend vai informar isso junto com os dados do usuário (/users/me).
 */
export function hasPremium(user) {
  return !!user?.premium;
}

/** O usuário pode jogar esta cruzadinha? */
export function canPlayPuzzle(puzzle, user) {
  if (__DEV__ && DEV_UNLOCK_ALL) return true;
  return isPuzzleFree(puzzle) || hasPremium(user);
}
