import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export default function Keyboard({ onKey, onDelete }) {
  return (
    <View style={styles.wrap}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {i === 2 && <View style={{ flex: 0.5 }} />}
          {row.map((k) => (
            <Pressable
              key={k}
              onPress={() => onKey(k)}
              style={({ pressed }) => [
                styles.key,
                pressed && styles.keyPressed,
              ]}
            >
              <Text style={styles.keyText}>{k}</Text>
            </Pressable>
          ))}
          {i === 2 && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.key,
                styles.del,
                pressed && styles.keyPressed,
              ]}
            >
              <Text style={styles.keyText}>⌫</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 4, paddingBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 7 },
  key: {
    flex: 1,
    marginHorizontal: 2.5,
    height: 46,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.keyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  del: { flex: 1.5, backgroundColor: theme.colors.card },
  keyPressed: { backgroundColor: theme.colors.primary },
  keyText: { color: theme.colors.keyText, fontSize: 18, fontWeight: '700' },
});
