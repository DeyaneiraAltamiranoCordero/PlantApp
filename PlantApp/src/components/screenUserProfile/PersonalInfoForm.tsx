import React from 'react';
import { View, Text } from 'react-native';
import { useProfileTheme } from '../../screens/userProfile/UserProfile.styles';
import { Input } from '../ui/Input';

interface PersonalInfoFormProps {
    name: string;
    nickname: string;
    birthday: string;
    description: string;
    bibliography: string;
    onNameChange: (val: string) => void;
    onNicknameChange: (val: string) => void;
    onBirthdayChange: (val: string) => void;
    onDescriptionChange: (val: string) => void;
    onBibliographyChange: (val: string) => void;
}

export function PersonalInfoForm({
    name,
    nickname,
    birthday,
    description,
    bibliography,
    onNameChange,
    onNicknameChange,
    onBirthdayChange,
    onDescriptionChange,
    onBibliographyChange
}: PersonalInfoFormProps) {
    const { styles } = useProfileTheme();

    return (
        <View style={styles.formCard}>
            <Text style={styles.formTitle}>Información del Usuario</Text>

            <Input
                label="Nombre"
                iconName="user"
                placeholder="Tu nombre completo"
                value={name}
                onChangeText={onNameChange}
            />

            <Input
                label="Apodo"
                iconName="at-sign"
                placeholder="Tu apodo"
                value={nickname}
                onChangeText={onNicknameChange}
            />

            <Input
                label="Cumpleaños"
                iconName="calendar"
                placeholder="YYYY-MM-DD"
                value={birthday}
                onChangeText={onBirthdayChange}
            />

            <Input
                label="Descripción"
                iconName="file-text"
                placeholder="Cuéntanos sobre ti y tu amor por las plantas..."
                value={description}
                onChangeText={onDescriptionChange}
                multiline
            />

            <Input
                label="Bibliografía"
                iconName="book"
                placeholder="Enlaces, fuentes o libros recomendados..."
                value={bibliography}
                onChangeText={onBibliographyChange}
                multiline
            />
        </View>
    );
}