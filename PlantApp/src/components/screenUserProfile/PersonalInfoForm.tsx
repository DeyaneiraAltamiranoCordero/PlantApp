import React from 'react';
import { View, Text } from 'react-native';
import { useProfileTheme } from '../../screens/userProfile/UserProfile.styles';
import { Input } from '../ui/Input';

interface PersonalInfoFormProps {
    name: string;
    lastName: string;
    secondLastName: string;
    nickname: string;
    birthday: string;
    description: string;
    email: string;
    onNameChange: (val: string) => void;
    onLastNameChange: (val: string) => void;
    onSecondLastNameChange: (val: string) => void;
    onNicknameChange: (val: string) => void;
    onBirthdayChange: (val: string) => void;
    onDescriptionChange: (val: string) => void;
}

export function PersonalInfoForm({
    name,
    lastName,
    secondLastName,
    nickname,
    birthday,
    description,
    email,
    onNameChange,
    onLastNameChange,
    onSecondLastNameChange,
    onNicknameChange,
    onBirthdayChange,
    onDescriptionChange,
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
                label="Primer apellido"
                iconName="user"
                placeholder="Tu primer apellido"
                value={lastName}
                onChangeText={onLastNameChange}
            />

            <Input
                label="Segundo apellido"
                iconName="user"
                placeholder="Tu segundo apellido"
                value={secondLastName}
                onChangeText={onSecondLastNameChange}
            />

            <Input
                label="Apodo"
                iconName="at-sign"
                placeholder="Tu apodo"
                value={nickname}
                onChangeText={onNicknameChange}
            />

            <Input
                label="Correo"
                iconName="mail"
                value={email}
                editable={false}
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
        </View>
    );
}