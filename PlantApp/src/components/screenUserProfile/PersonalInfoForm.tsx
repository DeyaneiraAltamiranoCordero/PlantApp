import React from 'react';
import { View, Text } from 'react-native';
import { useProfileTheme } from '../../screens/userProfile/UserProfile.styles';
import { InputText } from '../ui/InputText';
import { Control } from 'react-hook-form';
import { ISODateStringSchema } from '../../context/services/schemas';

export type PersonalInfoFormValues = {
    name: string;
    lastName: string;
    secondLastName: string;
    nickname: string;
    email: string;
    birthday: string;
    description: string;
};

interface PersonalInfoFormProps {
    control: Control<PersonalInfoFormValues>;
}

export function PersonalInfoForm({
    control,
}: PersonalInfoFormProps) {
    const { styles } = useProfileTheme();

    return (
        <View style={styles.formCard}>
            <Text style={styles.formTitle}>Información del Usuario</Text>

            <InputText
                control={control}
                name="name"
                label="Nombre"
                iconName="user"
                placeholder="Tu nombre completo"
                required
                rules={{ required: 'El nombre es obligatorio.' }}
            />

            <InputText
                control={control}
                name="lastName"
                label="Primer apellido"
                iconName="user"
                placeholder="Tu primer apellido"
            />

            <InputText
                control={control}
                name="secondLastName"
                label="Segundo apellido"
                iconName="user"
                placeholder="Tu segundo apellido"
            />

            <InputText
                control={control}
                name="nickname"
                label="Apodo"
                iconName="at-sign"
                placeholder="Tu apodo"
                required
                rules={{ required: 'El apodo es obligatorio.' }}
            />

            <InputText
                control={control}
                name="email"
                label="Correo"
                iconName="mail"
                editable={false}
            />

            <InputText
                control={control}
                name="birthday"
                label="Cumpleaños"
                iconName="calendar"
                placeholder="YYYY-MM-DD"
                helperText="Formato recomendado: YYYY-MM-DD"
                rules={{
                    validate: (value) => {
                        const normalized = String(value ?? '').trim();
                        if (!normalized) return true;

                        const parsed = ISODateStringSchema.safeParse(normalized);
                        return parsed.success || (parsed.error.issues[0]?.message ?? 'Fecha inválida.');
                    },
                }}
            />

            <InputText
                control={control}
                name="description"
                label="Descripción"
                iconName="file-text"
                placeholder="Cuéntanos sobre ti y tu amor por las plantas..."
                multiline
            />
        </View>
    );
}