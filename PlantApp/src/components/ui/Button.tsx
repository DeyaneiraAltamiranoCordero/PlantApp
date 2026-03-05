import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useProfileTheme } from '../../screens/userProfile/UserProfile.styles';

interface ButtonProps {
    title: string;
    onPress: () => void;
    icon?: keyof typeof Feather.glyphMap;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Button({
    title,
    onPress,
    icon,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
}: ButtonProps) {
    const { theme } = useProfileTheme();

    const getButtonStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            borderRadius: theme.spacing.lg,
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                android: {
                    elevation: 2,
                },
            }),
        };

        const sizeStyles = {
            sm: {
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
            },
            md: {
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
            },
            lg: {
                paddingHorizontal: theme.spacing.xl,
                paddingVertical: theme.spacing.lg,
            },
        };

        const variantStyles = {
            primary: {
                backgroundColor: disabled ? theme.colors.muted : theme.colors.primary,
                borderWidth: 0,
            },
            secondary: {
                backgroundColor: disabled ? theme.colors.muted : theme.colors.secondary,
                borderWidth: 0,
            },
            outline: {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: disabled ? theme.colors.mutedForeground : theme.colors.primary,
            },
        };

        return {
            ...baseStyle,
            ...sizeStyles[size],
            ...variantStyles[variant],
            ...style,
        };
    };

    const getTextStyle = (): TextStyle => {
        const baseTextStyle: TextStyle = {
            fontWeight: theme.typography.weight.bold,
            fontFamily: theme.typography.fontFamily.bold,
            textAlign: 'center',
        };

        const sizeTextStyles = {
            sm: { fontSize: theme.typography.size.sm },
            md: { fontSize: theme.typography.size.base },
            lg: { fontSize: theme.typography.size.lg },
        };

        const variantTextStyles = {
            primary: {
                color: disabled ? theme.colors.mutedForeground : theme.colors.primaryForeground,
            },
            secondary: {
                color: disabled ? theme.colors.mutedForeground : theme.colors.secondaryForeground,
            },
            outline: {
                color: disabled ? theme.colors.mutedForeground : theme.colors.primary,
            },
        };

        return {
            ...baseTextStyle,
            ...sizeTextStyles[size],
            ...variantTextStyles[variant],
            ...textStyle,
        };
    };

    const getIconColor = () => {
        if (disabled) return theme.colors.mutedForeground;

        switch (variant) {
            case 'primary':
                return theme.colors.primaryForeground;
            case 'secondary':
                return theme.colors.secondaryForeground;
            case 'outline':
                return theme.colors.primary;
            default:
                return theme.colors.primaryForeground;
        }
    };

    const getIconSize = () => {
        switch (size) {
            case 'sm':
                return 14;
            case 'lg':
                return 20;
            default:
                return 16;
        }
    };

    return (
        <TouchableOpacity
            style={getButtonStyle()}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={getIconColor()}
                />
            ) : icon ? (
                <Feather
                    name={icon}
                    size={getIconSize()}
                    color={getIconColor()}
                />
            ) : null}
            <Text style={getTextStyle()}>
                {loading ? 'Cargando...' : title}
            </Text>
        </TouchableOpacity>
    );
}