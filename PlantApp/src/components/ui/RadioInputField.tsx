import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../theme/desingSystem';

export type RadioValue = string | number | boolean;

export type RadioOption<TValue extends RadioValue> = {
  value: TValue;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioInputBaseProps<TValue extends RadioValue> = {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  options: Array<RadioOption<TValue>>;
  value: TValue | null | undefined;
  onChange: (next: TValue) => void;
  direction?: 'column' | 'row';
  style?: StyleProp<ViewStyle>;
};

export type RadioInputFieldProps<TValue extends RadioValue> = RadioInputBaseProps<TValue>;

export function RadioInputField<TValue extends RadioValue>({
  label,
  required,
  helperText,
  error,
  options,
  value,
  onChange,
  direction = 'column',
  style,
}: RadioInputFieldProps<TValue>) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={style}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View style={[styles.optionsContainer, direction === 'row' && styles.optionsRow]}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const isDisabled = Boolean(opt.disabled);
          return (
            <TouchableOpacity
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              disabled={isDisabled}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                isDisabled && { opacity: 0.5 },
              ]}
            >
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected ? <View style={styles.radioInner} /> : null}
              </View>

              <View style={styles.textBlock}>
                <Text style={styles.optionLabel} numberOfLines={1}>
                  {opt.label}
                </Text>
                {opt.description ? (
                  <Text style={styles.optionDescription} numberOfLines={2}>
                    {opt.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    label: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
      marginBottom: theme.spacing.xs,
      fontFamily: theme.typography.fontFamily.default,
    },
    required: {
      color: theme.colors.destructive,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    optionsContainer: {
      gap: theme.spacing.sm,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.muted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}12`,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
      backgroundColor: theme.colors.card,
    },
    radioOuterSelected: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      fontSize: theme.typography.size.base,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    optionDescription: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
      fontFamily: theme.typography.fontFamily.default,
    },
    helperText: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
      fontFamily: theme.typography.fontFamily.default,
    },
    errorText: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.size.sm,
      color: theme.colors.destructive,
      fontFamily: theme.typography.fontFamily.default,
    },
  });
}
