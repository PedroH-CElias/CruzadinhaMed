/**
 * Campo de formulário padrão do app (rótulo + input + mensagem de erro).
 *
 * Props principais:
 * - label:  texto exibido acima do campo;
 * - error:  mensagem de validação (deixa a borda vermelha e mostra o texto abaixo);
 * - secure: campo de senha, com botão "Mostrar/Ocultar";
 * - demais props são repassadas ao TextInput (value, onChangeText, keyboardType...).
 */
import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';

const FormInput = forwardRef(function FormInput(
  { label, error, secure = false, style, onFocus, onBlur, ...inputProps },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  // Cor da borda: vermelho se houver erro, azul quando focado, padrão nos demais casos
  const borderColor = error
    ? theme.colors.error
    : focused
    ? theme.colors.primary
    : theme.colors.cardBorder;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, { borderColor }]}>
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secure && hidden}
          autoCorrect={false}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />

        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
          >
            <Text style={styles.toggle}>{hidden ? 'Mostrar' : 'Ocultar'}</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default FormInput;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.font.small,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    paddingVertical: 14,
  },
  toggle: { color: theme.colors.primary, fontSize: theme.font.small, fontWeight: '700' },
  error: { color: theme.colors.error, fontSize: 12, marginTop: 6 },
});
