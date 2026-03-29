import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Plant } from '../../context/services/api';
import { Button } from '../ui/Button';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';
import { AppTheme } from '../../theme/desingSystem';

export type PlantDetailFormValues = {
  name: string;
  categoryName: string;
  description: string;
  lightPreference: string;
  temperature: string;
  notes: string;
  status: string;
};

interface PlantDetailFormProps {
  plant: Plant;
  onSave: (values: PlantDetailFormValues) => Promise<void>;
  loading?: boolean;
}

export function PlantDetailForm({ plant, onSave, loading }: PlantDetailFormProps) {
  const { theme } = usePlantCareStyles();
  const formStyles = useMemo(() => createFormStyles(theme), [theme]);

  const [values, setValues] = useState<PlantDetailFormValues>({
    name: plant.name,
    categoryName: plant.categoryName || plant.categoryId || '',
    description: plant.description || '',
    lightPreference: plant.lightPreference || '',
    temperature: plant.temperature || '',
    notes: plant.notes || '',
    status: plant.status || '',
  });

  const handleChange = (field: keyof PlantDetailFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onSave(values);
  };

  return (
    <View style={formStyles.card}>
      <Text style={formStyles.sectionTitle}>Información General</Text>
      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Nombre</Text>
        <TextInput
          style={formStyles.input}
          value={values.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder="Ej. Monstera deliciosa"
          placeholderTextColor={theme.colors.mutedForeground}
        />
      </View>
      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Categoría</Text>
        <TextInput
          style={formStyles.input}
          value={values.categoryName}
          onChangeText={(text) => handleChange('categoryName', text)}
          placeholder="Ej. Tropical"
          placeholderTextColor={theme.colors.mutedForeground}
        />
      </View>
      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Estado</Text>
        <TextInput
          style={formStyles.input}
          value={values.status}
          onChangeText={(text) => handleChange('status', text)}
          placeholder="Saludable, En tratamiento, etc."
          placeholderTextColor={theme.colors.mutedForeground}
        />
      </View>

      <Text style={[formStyles.sectionTitle, { marginTop: theme.spacing.xl }]}>Cuidados</Text>
      <View style={formStyles.fieldRow}>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Luz</Text>
          <TextInput
            style={formStyles.input}
            value={values.lightPreference}
            onChangeText={(text) => handleChange('lightPreference', text)}
            placeholder="Indirecta brillante"
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Temperatura</Text>
          <TextInput
            style={formStyles.input}
            value={values.temperature}
            onChangeText={(text) => handleChange('temperature', text)}
            placeholder="18-24°C"
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Notas</Text>
        <TextInput
          style={[formStyles.input, formStyles.textArea]}
          multiline
          value={values.notes}
          onChangeText={(text) => handleChange('notes', text)}
          placeholder="Riega cada 7 días, fertiliza en primavera..."
          placeholderTextColor={theme.colors.mutedForeground}
        />
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Descripción</Text>
        <TextInput
          style={[formStyles.input, formStyles.textArea]}
          multiline
          value={values.description}
          onChangeText={(text) => handleChange('description', text)}
          placeholder="Detalles adicionales de la planta"
          placeholderTextColor={theme.colors.mutedForeground}
        />
      </View>

      <Button
        title="Guardar cambios"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ marginTop: theme.spacing.xl }}
      />
    </View>
  );
}

function createFormStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.typography.size.lg,
      fontWeight: theme.typography.weight.bold,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.foreground,
      marginBottom: theme.spacing.md,
    },
    fieldGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
      marginBottom: theme.spacing.xs,
      fontFamily: theme.typography.fontFamily.default,
    },
    input: {
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.foreground,
      borderWidth: 1,
      borderColor: 'transparent',
      fontFamily: theme.typography.fontFamily.default,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    fieldRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    fieldHalf: {
      flex: 1,
    },
  });
}
