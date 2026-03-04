import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { Feather } from '@expo/vector-icons';
import { getStyles } from '../../screens/userProfile/UserProfilestyles';

interface PersonalInfoFormProps {
    name: string;
    nickname: string;
    birthday: string;
    description: string;
    onNameChange: (val: string) => void;
    onNicknameChange: (val: string) => void;
    onBirthdayChange: (val: string) => void;
    onDescriptionChange: (val: string) => void;
    theme: ThemeColors;
}

interface FormFieldProps {
    iconName: keyof typeof Feather.glyphMap;
    label: string;
    children: React.ReactNode;
    theme: ThemeColors;
}

function FormField({ iconName, label, children, theme }: FormFieldProps) {
    const styles = getStyles(theme);
    return (
        <View style={styles.fieldContainer}>
            <View style={styles.labelContainer}>
                <Feather name={iconName} size={16} color={styles.unifiedIcon.color} />
                <Text style={styles.label}>{label}</Text>
            </View>
            {children}
        </View>
    );
}

export function PersonalInfoForm({
    name,
    nickname,
    birthday,
    description,
    onNameChange,
    onNicknameChange,
    onBirthdayChange,
    onDescriptionChange,
    theme
}: PersonalInfoFormProps) {
    const styles = getStyles(theme);

    return (
        //Forms para la información personal del usuario
        <View style={styles.formCard}>
            <Text style={styles.formTitle}>Información del Usuario</Text>

            <FormField iconName="user" label="Nombre" theme={theme}>
                <TextInput
                    style={styles.input}
                    placeholder="Tu nombre completo"
                    placeholderTextColor={theme.mutedForeground}
                    value={name}
                    onChangeText={onNameChange}
                />
            </FormField>

            <FormField iconName="at-sign" label="Apodo" theme={theme}>
                <TextInput
                    style={styles.input}
                    placeholder="Tu apodo"
                    placeholderTextColor={theme.mutedForeground}
                    value={nickname}
                    onChangeText={onNicknameChange}
                />
            </FormField>

            <FormField iconName="calendar" label="Cumpleaños" theme={theme}>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.mutedForeground}
                    value={birthday}
                    onChangeText={onBirthdayChange}
                />
            </FormField>

            <FormField iconName="file-text" label="Descripción" theme={theme}>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Cuéntanos sobre ti y tu amor por las plantas..."
                    placeholderTextColor={theme.mutedForeground}
                    value={description}
                    onChangeText={onDescriptionChange}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </FormField>
        </View>
    );
}
