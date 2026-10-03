/**
 * Cabeçalho simples das telas internas: "‹ Voltar" à esquerda e título centralizado.
 *
 * Props:
 * - title:     texto central;
 * - backLabel: texto do botão de voltar (ex.: "Minha conta");
 * - onBack:    ação ao tocar em voltar.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function ScreenHeader({ title, backLabel = 'Voltar', onBack }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={styles.side}>
        <Text style={styles.back} numberOfLines={1}>‹ {backLabel}</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  side: { width: 110 },
  back: { color: theme.colors.textMuted, fontSize: 16 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
});
