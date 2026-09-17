import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPuzzle } from '../data/puzzles';
import {
  buildBoard,
  cellsForEntry,
  isEntrySolved,
  isBoardSolved,
  countSolved,
} from '../engine';
import CrosswordGrid from '../components/CrosswordGrid';
import Keyboard from '../components/Keyboard';
import { theme } from '../theme';

export default function GameScreen({ route, navigation }) {
  const { id } = route.params;
  const puzzle = useMemo(() => getPuzzle(id), [id]);
  const board = useMemo(() => buildBoard(puzzle), [puzzle]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const cellSize = Math.max(
    26,
    Math.min(40, Math.floor((width - 16) / board.cols) - 2)
  );

  const [values, setValues] = useState({});
  const [activeNumber, setActiveNumber] = useState(board.across[0]?.number ?? board.down[0]?.number);
  const [dir, setDir] = useState(board.across.length ? 'across' : 'down');
  const [cellIndex, setCellIndex] = useState(0);

  const entryList = dir === 'across' ? board.across : board.down;
  const activeEntry =
    board.entries.find((e) => e.dir === dir && e.number === activeNumber) ||
    entryList[0];

  const wordCells = activeEntry ? cellsForEntry(activeEntry) : [];
  const activeCell = wordCells[cellIndex] || wordCells[0];

  const solvedCount = countSolved(board, values);
  const solved = isBoardSolved(board, values);

  // Células que fazem parte de uma palavra já completada corretamente.
  const solvedCells = useMemo(() => {
    const set = new Set();
    board.entries.forEach((e) => {
      if (isEntrySolved(e, values)) {
        cellsForEntry(e).forEach((c) => set.add(`${c.row}-${c.col}`));
      }
    });
    return set;
  }, [board, values]);

  const selectEntry = useCallback((entry, index = 0) => {
    setDir(entry.dir);
    setActiveNumber(entry.number);
    setCellIndex(index);
  }, []);

  const onCellPress = useCallback(
    (cell) => {
      const k = `${cell.row}-${cell.col}`;
      const sameCell = activeCell && `${activeCell.row}-${activeCell.col}` === k;
      // Alterna direção ao tocar de novo na célula ativa.
      const wantDir = sameCell
        ? cell.across != null && cell.down != null
          ? dir === 'across'
            ? 'down'
            : 'across'
          : dir
        : dir;

      const dirToUse = cell[wantDir] != null ? wantDir : cell.across != null ? 'across' : 'down';
      const number = cell[dirToUse];
      const entry = board.entries.find(
        (e) => e.dir === dirToUse && e.number === number
      );
      if (!entry) return;
      const idx = cellsForEntry(entry).findIndex(
        (c) => c.row === cell.row && c.col === cell.col
      );
      selectEntry(entry, Math.max(0, idx));
    },
    [activeCell, dir, board, selectEntry]
  );

  const goToEntry = (offset) => {
    const list = board.entries;
    const i = list.findIndex(
      (e) => e.dir === dir && e.number === activeNumber
    );
    const next = list[(i + offset + list.length) % list.length];
    selectEntry(next, 0);
  };

  const onKey = useCallback(
    (letter) => {
      if (!activeCell) return;
      const k = `${activeCell.row}-${activeCell.col}`;
      setValues((v) => ({ ...v, [k]: letter }));
      if (cellIndex < wordCells.length - 1) {
        setCellIndex((i) => i + 1);
      }
    },
    [activeCell, cellIndex, wordCells.length]
  );

  const onDelete = useCallback(() => {
    if (!activeCell) return;
    const k = `${activeCell.row}-${activeCell.col}`;
    if (values[k]) {
      setValues((v) => ({ ...v, [k]: '' }));
    } else if (cellIndex > 0) {
      const prev = wordCells[cellIndex - 1];
      const pk = `${prev.row}-${prev.col}`;
      setValues((v) => ({ ...v, [pk]: '' }));
      setCellIndex((i) => i - 1);
    }
  }, [activeCell, values, cellIndex, wordCells]);

  const revealWord = () => {
    if (!activeEntry) return;
    const updates = {};
    cellsForEntry(activeEntry).forEach((c, i) => {
      updates[`${c.row}-${c.col}`] = activeEntry.answer[i];
    });
    setValues((v) => ({ ...v, ...updates }));
  };

  const entrySolved = activeEntry && isEntrySolved(activeEntry, values);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Voltar</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{puzzle.categoryName}</Text>
          <Text style={styles.progress}>
            {puzzle.difficultyName} · Nível {puzzle.level} · {solvedCount}/
            {board.entries.length}
          </Text>
        </View>
        <Pressable onPress={revealWord} hitSlop={12}>
          <Text style={styles.hint}>Dica</Text>
        </Pressable>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(solvedCount / board.entries.length) * 100}%`,
              backgroundColor: puzzle.color,
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.boardScrollV}
        contentContainerStyle={styles.boardWrapV}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          contentContainerStyle={styles.boardWrapH}
          showsHorizontalScrollIndicator={false}
        >
          <CrosswordGrid
            board={board}
            values={values}
            cellSize={cellSize}
            activeCell={activeCell}
            activeWordCells={wordCells}
            solvedCells={solvedCells}
            onCellPress={onCellPress}
          />
        </ScrollView>
      </ScrollView>

      {solved ? (
        <View style={styles.doneBanner}>
          <Text style={styles.doneTitle}>🎉 Cruzadinha concluída!</Text>
          <Pressable
            style={styles.doneBtn}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.doneBtnText}>Escolher outra</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.clueBar}>
          <Pressable onPress={() => goToEntry(-1)} hitSlop={10}>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Pressable style={styles.clueTextWrap} onPress={() => activeCell && onCellPress(activeCell)}>
            <Text style={styles.clueLabel}>
              {activeEntry?.number} {dir === 'across' ? 'Horizontal' : 'Vertical'}
              {entrySolved ? '  ✓' : ''}
            </Text>
            <Text style={styles.clueText}>{activeEntry?.clue}</Text>
          </Pressable>
          <Pressable onPress={() => goToEntry(1)} hitSlop={10}>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>
      )}

      <View style={{ paddingBottom: insets.bottom }}>
        <Keyboard onKey={onKey} onDelete={onDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  back: { color: theme.colors.textMuted, fontSize: 16, width: 70 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  progress: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  hint: { color: theme.colors.primary, fontSize: 15, fontWeight: '700', width: 70, textAlign: 'right' },
  progressBar: {
    height: 5,
    backgroundColor: theme.colors.bgSoft,
    borderRadius: 3,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3 },
  boardScrollV: { flex: 1 },
  boardWrapV: { paddingVertical: 14 },
  boardWrapH: {
    paddingHorizontal: 8,
    flexGrow: 1,
    justifyContent: 'center',
  },
  clueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: 10,
    borderRadius: theme.radius.md,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 8,
  },
  arrow: { color: theme.colors.primary, fontSize: 30, paddingHorizontal: 10, fontWeight: '700' },
  clueTextWrap: { flex: 1, paddingHorizontal: 4 },
  clueLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  clueText: { color: theme.colors.text, fontSize: 15, lineHeight: 20 },
  doneBanner: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 10,
    borderRadius: theme.radius.md,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  doneTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  doneBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
