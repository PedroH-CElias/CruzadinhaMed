// Motor da cruzadinha: transforma um puzzle (lista de palavras) numa
// estrutura de células navegável, com validação de respostas.

export function buildBoard(puzzle) {
  const { rows, cols, entries } = puzzle;

  // Mapa de células ativas: key "r-c" -> { row, col, solution, number, across, down }
  const cells = {};
  const key = (r, c) => `${r}-${c}`;

  entries.forEach((entry) => {
    const dr = entry.dir === 'across' ? 0 : 1;
    const dc = entry.dir === 'across' ? 1 : 0;
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.row + dr * i;
      const c = entry.col + dc * i;
      const k = key(r, c);
      if (!cells[k]) {
        cells[k] = { row: r, col: c, solution: entry.answer[i], number: null };
      }
      cells[k][entry.dir] = entry.number;
      if (i === 0) cells[k].number = entry.number;
    }
  });

  const across = entries
    .filter((e) => e.dir === 'across')
    .sort((a, b) => a.number - b.number);
  const down = entries
    .filter((e) => e.dir === 'down')
    .sort((a, b) => a.number - b.number);

  return { rows, cols, cells, entries, across, down, key };
}

// Células (na ordem) que compõem uma palavra.
export function cellsForEntry(entry) {
  const out = [];
  const dr = entry.dir === 'across' ? 0 : 1;
  const dc = entry.dir === 'across' ? 1 : 0;
  for (let i = 0; i < entry.answer.length; i++) {
    out.push({ row: entry.row + dr * i, col: entry.col + dc * i });
  }
  return out;
}

// A palavra está totalmente correta?
export function isEntrySolved(entry, values) {
  const dr = entry.dir === 'across' ? 0 : 1;
  const dc = entry.dir === 'across' ? 1 : 0;
  for (let i = 0; i < entry.answer.length; i++) {
    const k = `${entry.row + dr * i}-${entry.col + dc * i}`;
    if ((values[k] || '') !== entry.answer[i]) return false;
  }
  return true;
}

export function isBoardSolved(board, values) {
  return board.entries.every((e) => isEntrySolved(e, values));
}

export function countSolved(board, values) {
  return board.entries.filter((e) => isEntrySolved(e, values)).length;
}
