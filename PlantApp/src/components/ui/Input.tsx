import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

export interface InputProps extends TextInputProps {
    label?: string;
    iconName?: keyof typeof Feather.glyphMap;
}

export function Input({ label, iconName, style, multiline, ...props }: InputProps) {
    const { theme, isDark } = useTheme();

    const styles = StyleSheet.create({
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
            minHeight: multiline ? 100 : 'auto',
            textAlignVertical: multiline ? 'top' : 'center',
        },
    });

    return (
        <View style={styles.fieldContainer}>
            {(label || iconName) && (
                <View style={styles.labelContainer}>
                    {iconName && <Feather name={iconName} size={16} color={styles.icon.color} />}
                    {label && <Text style={styles.label}>{label}</Text>}
                </View>
            )}
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor={theme.colors.mutedForeground}
                multiline={multiline}
                {...props}
            />
        </View>
    );
}
