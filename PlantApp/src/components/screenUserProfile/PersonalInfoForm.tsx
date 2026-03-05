import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useProfileTheme } from '../../screens/userProfile/UserProfilestyles';

interface PersonalInfoFormProps {
    name: string;
    nickname: string;
    birthday: string;
    description: string;
    onNameChange: (val: string) => void;
    onNicknameChange: (val: string) => void;
    onBirthdayChange: (val: string) => void;
    onDescriptionChange: (val: string) => void;
}

interface FormFieldProps {
    iconName: keyof typeof Feather.glyphMap;
    label: string;
    children: React.ReactNode;
}

function FormField({ iconName, label, children }: FormFieldProps) {
    const { theme, styles } = useProfileTheme();
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
    onDescriptionChange
}: PersonalInfoFormProps) {
    const { theme, styles } = useProfileTheme();

    return (
        <View style={styles.formCard}>
            {/* Información personal del usuario */}
            <Text style={styles.formTitle}>Información del Usuario</Text>

            <FormField iconName="user" label="Nombre">
                <TextInput
                    style={styles.input}
                    placeholder="Tu nombre completo"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={name}
                    onChangeText={onNameChange}
                />
            </FormField>

            <FormField iconName="at-sign" label="Apodo">
                <TextInput
                    style={styles.input}
                    placeholder="Tu apodo"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={nickname}
                    onChangeText={onNicknameChange}
                />
            </FormField>

            <FormField iconName="calendar" label="Cumpleaños">
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={birthday}
                    onChangeText={onBirthdayChange}
                />
            </FormField>

            <FormField iconName="file-text" label="Descripción">
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Cuéntanos sobre ti y tu amor por las plantas..."
                    placeholderTextColor={theme.colors.mutedForeground}
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
