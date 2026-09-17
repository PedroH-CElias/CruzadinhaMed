import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';

// Renderiza a grade. Cada célula ativa é tocável.
export default function CrosswordGrid({
  board,
  values,
  cellSize,
  activeCell,
  activeWordCells,
  solvedCells,
  onCellPress,
}) {
  const { rows, cols, cells, key } = board;

  const activeSet = new Set(activeWordCells.map((c) => `${c.row}-${c.col}`));
  const activeKey = activeCell ? `${activeCell.row}-${activeCell.col}` : null;

  return (
    <View style={styles.board}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: cols }).map((_, c) => {
            const k = key(r, c);
            const cell = cells[k];
            if (!cell) {
              return (
                <View
                  key={c}
                  style={{ width: cellSize, height: cellSize, margin: 1 }}
                />
              );
            }
            const isActive = k === activeKey;
            const inWord = activeSet.has(k);
            const isSolved = solvedCells ? solvedCells.has(k) : false;
            const value = values[k] || '';
            const bg = isActive
              ? theme.colors.cellActive
              : isSolved
              ? theme.colors.solved
              : inWord
              ? theme.colors.cellHighlight
              : theme.colors.cellEmpty;

            return (
              <Pressable
                key={c}
                onPress={() => onCellPress(cell)}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: bg,
                    borderColor: isActive
                      ? theme.colors.primary
                      : isSolved
                      ? theme.colors.solvedBorder
                      : theme.colors.cardBorder,
                  },
                ]}
              >
                {cell.number ? (
                  <Text style={[styles.num, { fontSize: cellSize * 0.26 }]}>
                    {cell.number}
                  </Text>
                ) : null}
                <Text style={[styles.letter, { fontSize: cellSize * 0.5 }]}>
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { alignSelf: 'center' },
  row: { flexDirection: 'row' },
  cell: {
    borderWidth: 1,
    borderRadius: 6,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    position: 'absolute',
    top: 1,
    left: 3,
    color: theme.colors.text,
    fontWeight: '600',
    opacity: 0.8,
  },
  letter: { color: theme.colors.cellText, fontWeight: '800' },
});
