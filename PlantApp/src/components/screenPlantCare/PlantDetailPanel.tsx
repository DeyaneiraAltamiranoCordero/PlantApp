import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Category, getCategories, Plant, updatePlant } from '../../context/services/api';
import { PlantDetailForm, PlantDetailFormValues } from './PlantDetailForm';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';
import { Button } from '../ui/Button';

type PestInfo = {
  id: string;
  name: string;
  scientificName: string;
  dangerLevel: string;
  description: string;
  treatment: string;
};

const PEST_CATALOG: Record<string, Omit<PestInfo, 'id'>> = {
  'pst-1': {
    name: 'Pulgón',
    scientificName: 'Aphidoidea',
    dangerLevel: 'Alto',
    description:
      'Pequeños insectos que succionan la savia de las plantas, causando daño en hojas y tallos.',
    treatment: 'Insecticidas naturales como jabón insecticida o aceite de neem',
  },
};

interface PlantDetailPanelProps {
  visible: boolean;
  plant: Plant | null;
  onClose: () => void;
  onPlantUpdated: (plant: Plant) => void;
}

export function PlantDetailPanel({ visible, plant, onClose, onPlantUpdated }: PlantDetailPanelProps) {
  const { styles, theme } = usePlantCareStyles();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPestsVisible, setIsPestsVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsSaving(false);
      setIsPestsVisible(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setCategories([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await getCategories();
        if (!cancelled) {
          setCategories(result);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!plant) {
    return null;
  }

  const pests = Array.isArray(plant.pests) ? plant.pests : [];
  const pestsCount = pests.length;

  const getPestInfo = (pestId: string): PestInfo => {
    const info = PEST_CATALOG[pestId];
    if (!info) {
      return {
        id: pestId,
        name: pestId,
        scientificName: '—',
        dangerLevel: '—',
        description: 'Información no disponible por el momento.',
        treatment: '—',
      };
    }
    return { id: pestId, ...info };
  };

  const handleRemovePest = async (pestId: string) => {
    Alert.alert(
      'Eliminar plaga',
      '¿Querés eliminar esta plaga de la lista?'
      ,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const nextPests = pests.filter((id) => id !== pestId);
              const nextStatus = nextPests.length > 0 ? 'Enferma' : 'Saludable';

              const updated = await updatePlant(plant.id, {
                pests: nextPests,
                status: nextStatus,
              });
              onPlantUpdated(updated);
            } catch (error) {
              console.error('Error eliminando plaga', error);
              Alert.alert('Error', 'No pudimos eliminar la plaga.');
            }
          },
        },
      ],
    );
  };

  const handleSave = async (values: PlantDetailFormValues) => {
    try {
      setIsSaving(true);

      const parseList = (raw: string) =>
        raw
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

      const careTypes = parseList(values.careTypes);
      const price = values.price.trim() ? Number(values.price) : undefined;
      const nextStatus = pestsCount > 0 ? 'Enferma' : 'Saludable';

      const nextCategoryIds = Array.isArray(values.categoryIds) ? values.categoryIds : [];
      const primaryCategoryId = nextCategoryIds[0];
      const primaryCategory = primaryCategoryId
        ? categories.find((cat) => cat.id === primaryCategoryId)
        : undefined;

      const updatedPlant = await updatePlant(plant.id, {
        name: values.name,
        ...(primaryCategoryId ? { categoryId: primaryCategoryId } : {}),
        ...(primaryCategory ? { categoryName: primaryCategory.name } : {}),
        categoryIds: nextCategoryIds,
        description: values.description,
        notes: values.notes,
        age: values.age,
        flowering: values.flowering,
        growthTime: values.growthTime,
        height: values.height,
        price: Number.isFinite(price) ? price : undefined,
        toxic: values.toxic,
        toxicTo: values.toxic ? (values.toxicTo.trim() ? values.toxicTo.trim() : null) : null,
        lightPreference: values.lightPreference,
        temperature: values.temperature,
        fertilizerType: values.fertilizerType,
        lastFertilized: values.lastFertilized,
        lastWatered: values.lastWatered,
        careTypes,
        status: nextStatus,
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
        <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl }}>
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
            {plant.categoryName || 'Sin categoría'}
          </Text>

          <PlantDetailForm
            plant={plant}
            categories={categories}
            pestsCount={pestsCount}
            onOpenPests={() => setIsPestsVisible(true)}
            onSave={handleSave}
            loading={isSaving}
          />
          <Button
            title="Cerrar"
            variant="secondary"
            onPress={onClose}
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>
      </ScrollView>

      <Modal
        visible={isPestsVisible}
        animationType="slide"
        onRequestClose={() => setIsPestsVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.lg,
              paddingBottom: theme.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: theme.spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.size.xl,
                  fontWeight: theme.typography.weight.bold,
                  color: theme.colors.foreground,
                  fontFamily: theme.typography.fontFamily.bold,
                }}
              >
                Plagas
              </Text>
              <Text style={{ color: theme.colors.mutedForeground, marginTop: theme.spacing.xs }}>
                {pestsCount > 0
                  ? `${pestsCount} ${pestsCount === 1 ? 'registro' : 'registros'}`
                  : 'Sin plagas registradas'}
              </Text>
            </View>

            <TouchableOpacity
              disabled
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.5,
              }}
              accessibilityRole="button"
              accessibilityLabel="Agregar plaga"
            >
              <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}
          >
            {pestsCount === 0 ? (
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.radius.xl,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: theme.spacing.xl,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.size.base,
                    color: theme.colors.foreground,
                    fontFamily: theme.typography.fontFamily.default,
                  }}
                >
                  No hay plagas registradas en esta planta.
                </Text>
              </View>
            ) : (
              pests.map((pestId) => {
                const info = getPestInfo(pestId);
                return (
                  <View
                    key={pestId}
                    style={{
                      backgroundColor: theme.colors.card,
                      borderRadius: theme.radius.xl,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      padding: theme.spacing.xl,
                      marginBottom: theme.spacing.lg,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md }}>
                      <Text
                        style={{
                          fontSize: theme.typography.size.lg,
                          color: theme.colors.foreground,
                          fontFamily: theme.typography.fontFamily.bold,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {info.name}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleRemovePest(pestId)}
                        activeOpacity={0.85}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: theme.radius.md,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.colors.card,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Eliminar plaga"
                      >
                        <Feather name="trash-2" size={16} color={theme.colors.destructive} />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: theme.colors.mutedForeground, marginTop: theme.spacing.xs }}>
                      {info.scientificName}
                    </Text>

                    <View
                      style={{
                        marginTop: theme.spacing.md,
                        alignSelf: 'flex-start',
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.xs,
                        borderRadius: theme.radius.md,
                        backgroundColor: theme.colors.muted,
                      }}
                    >
                      <Text style={{ color: theme.colors.foreground, fontFamily: theme.typography.fontFamily.semibold }}>
                        Nivel de peligro: {info.dangerLevel}
                      </Text>
                    </View>

                    <Text
                      style={{
                        marginTop: theme.spacing.lg,
                        color: theme.colors.foreground,
                        fontFamily: theme.typography.fontFamily.semibold,
                      }}
                    >
                      Descripción
                    </Text>
                    <Text style={{ color: theme.colors.mutedForeground, marginTop: theme.spacing.xs }}>
                      {info.description}
                    </Text>

                    <Text
                      style={{
                        marginTop: theme.spacing.lg,
                        color: theme.colors.foreground,
                        fontFamily: theme.typography.fontFamily.semibold,
                      }}
                    >
                      Tratamiento
                    </Text>
                    <Text style={{ color: theme.colors.mutedForeground, marginTop: theme.spacing.xs }}>
                      {info.treatment}
                    </Text>
                  </View>
                );
              })
            )}

            <Button
              title="Volver"
              variant="secondary"
              onPress={() => setIsPestsVisible(false)}
              style={{ marginTop: theme.spacing.md }}
            />
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}
