import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, View } from 'react-native';
import { Plant, updatePlant } from '../../context/services/api';
import { PlantDetailForm, PlantDetailFormValues } from './PlantDetailForm';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';
import { Button } from '../ui/Button';

interface PlantDetailPanelProps {
  visible: boolean;
  plant: Plant | null;
  onClose: () => void;
  onPlantUpdated: (plant: Plant) => void;
}

export function PlantDetailPanel({ visible, plant, onClose, onPlantUpdated }: PlantDetailPanelProps) {
  const { styles, theme } = usePlantCareStyles();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsSaving(false);
    }
  }, [visible]);

  if (!plant) {
    return null;
  }

  const handleSave = async (values: PlantDetailFormValues) => {
    try {
      setIsSaving(true);
      const updatedPlant = await updatePlant(plant.id, {
        name: values.name,
        categoryId: plant.categoryId,
        categoryName: values.categoryName,
        description: values.description,
        lightPreference: values.lightPreference,
        temperature: values.temperature,
        notes: values.notes,
        status: values.status,
      });
      onPlantUpdated(updatedPlant);
      Alert.alert('Listo', 'Guardamos los cambios de tu planta.');
    } catch (error) {
      console.error('Error actualizando planta', error);
      Alert.alert('Error', 'No pudimos guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {plant.imageUrl ? (
          <Image
            source={{ uri: plant.imageUrl }}
            style={{ width: '100%', height: 220, borderRadius: theme.radius.xl }}
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 220,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.colors.mutedForeground }}>Sin imagen</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: theme.typography.size.xxl,
              fontWeight: theme.typography.weight.bold,
              color: theme.colors.foreground,
            }}
          >
            {plant.name}
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, marginBottom: theme.spacing.xl }}>
            {plant.categoryName || plant.categoryId || 'Sin categoría'}
          </Text>

          <PlantDetailForm plant={plant} onSave={handleSave} loading={isSaving} />
          <Button
            title="Cerrar"
            variant="secondary"
            onPress={onClose}
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}
