import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

export interface InputTextBaseProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Feather.glyphMap;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export type InputTextFieldProps = InputTextBaseProps & {
  value: string;
};

export function InputTextField({
  label,
  iconName,
  helperText,
  error,
  required,
  style,
  multiline,
  onFocus,
  onBlur,
  ...props
}: InputTextFieldProps) {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fieldContainer: {
          gap: theme.spacing.sm,
          width: '100%',
        },
        labelContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
        },
        icon: {
          color: isDark ? theme.colors.secondaryForeground : theme.colors.primary,
        },
        label: {
          fontSize: theme.typography.size.base,
          fontWeight: theme.typography.weight.semibold,
          fontFamily: theme.typography.fontFamily.semibold,
          color: theme.colors.foreground,
        },
        requiredMark: {
          color: theme.colors.destructive,
          fontFamily: theme.typography.fontFamily.semibold,
        },
        input: {
          backgroundColor: theme.colors.muted,
          borderRadius: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          color: theme.colors.foreground,
          fontSize: theme.typography.size.base,
          fontFamily: theme.typography.fontFamily.default,
          borderWidth: 1,
          borderColor: 'transparent',
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        helperText: {
          fontSize: theme.typography.size.sm,
          color: theme.colors.mutedForeground,
          fontFamily: theme.typography.fontFamily.default,
        },
        errorText: {
          fontSize: theme.typography.size.sm,
          color: theme.colors.destructive,
          fontFamily: theme.typography.fontFamily.default,
        },
      }),
    [isDark, multiline, theme],
  );

  const borderColor = error
    ? theme.colors.destructive
    : isFocused
      ? theme.colors.ring
      : 'transparent';

  return (
    <View style={styles.fieldContainer}>
      {(label || iconName) && (
        <View style={styles.labelContainer}>
          {iconName && <Feather name={iconName} size={16} color={isDark ? theme.colors.secondaryForeground : theme.colors.primary} />}
          {label ? (
            <Text style={styles.label}>
              {label}
              {required ? <Text style={styles.requiredMark}> *</Text> : null}
            </Text>
          ) : null}
        </View>
      )}
      <TextInput
        style={[styles.input, { borderColor }, style]}
        placeholderTextColor={theme.colors.mutedForeground}
        multiline={multiline}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}
