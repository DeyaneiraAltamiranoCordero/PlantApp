export const typography = {
    fontFamily: {
        default: 'Nunito',
        semibold: 'Nunito',
        bold: 'Nunito',
    },
    size: {
        sm: 12,
        base: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
    },
    weight: {
        normal: 'normal' as const,
        semibold: '600' as const,
        bold: 'bold' as const,
    }
};

// helper function to get font family based on weight
export function getFontFamily(weight: 'normal' | 'semibold' | 'bold' = 'normal'): string {
    return 'Nunito';
}
