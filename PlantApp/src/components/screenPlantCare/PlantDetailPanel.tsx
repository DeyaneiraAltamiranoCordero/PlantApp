import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiError, ApiValidationError, CareType, Category, deletePlant, getCareTypes, getCategories, getPestDocument, getPests, Pest, Plant, updatePlant } from '../../context/services/api';
import { PlantDetailForm, PlantDetailFormValues } from './PlantDetailForm';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';
import { Button } from '../ui/Button';
import { AddItemCard } from '../ui/AddItemCard';
import { InfoCard } from '../ui/InfoCard';
import { ModalHeader } from '../ui/ModalHeader';
import { ToastViewport, useToast } from '../../context/ToastContext';

type CareTypeInfo = {
  id: string;
  name: string;
  description: string;
};

type PestInfo = {
  id: string;
  name: string;
  scientificName: string;
  dangerLevel: string;
  description: string;
  treatment: string;
};

const normalizeIdArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : (item as { id?: string } | null)?.id))
    .filter((item): item is string => Boolean(item));
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
  onPlantDeleted?: (plantId: string) => void;
}

export function PlantDetailPanel({ visible, plant, onClose, onPlantUpdated, onPlantDeleted }: PlantDetailPanelProps) {
  const { styles, theme } = usePlantCareStyles();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPestsVisible, setIsPestsVisible] = useState(false);
  const [isAddPestVisible, setIsAddPestVisible] = useState(false);
  const [pestsCatalog, setPestsCatalog] = useState<Pest[]>([]);
  const [isPestsLoading, setIsPestsLoading] = useState(false);  
  const [pestsError, setPestsError] = useState<string | null>(null);
  const requestedPestIdsRef = useRef<Set<string>>(new Set());
  const notFoundPestIdsRef = useRef<Set<string>>(new Set());
  const [isCareTypesVisible, setIsCareTypesVisible] = useState(false);
  const [isAddCareTypeVisible, setIsAddCareTypeVisible] = useState(false);
  const [careTypesCatalog, setCareTypesCatalog] = useState<CareType[]>([]);
  const [isCareTypesLoading, setIsCareTypesLoading] = useState(false);
  const [careTypesError, setCareTypesError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setIsSaving(false);
      setIsPestsVisible(false);
      setIsAddPestVisible(false);
      setPestsCatalog([]);
      setIsPestsLoading(false);
      setPestsError(null);
      setIsCareTypesVisible(false);
      setIsAddCareTypeVisible(false);
      setCareTypesCatalog([]);
      setIsCareTypesLoading(false);
      setCareTypesError(null);
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

  useEffect(() => {
    if (!visible) return;
    if (!isPestsVisible) return;
    if (!plant) return;

    // Always try to keep the catalog warm.
    void ensurePestsLoaded();

    const pestIds =
      Array.isArray(plant.pestIds) && plant.pestIds.length > 0
        ? plant.pestIds
        : normalizeIdArray(plant.pests);

    const plantPestObjectIds = new Set(
      (Array.isArray(plant.pests) ? plant.pests : [])
        .map((item) => (typeof item === 'string' ? null : item))
        .filter(Boolean)
        .map((item) => (item as Pest).id),
    );
    const catalogIds = new Set(pestsCatalog.map((item) => item.id));

    const missingIds = pestIds.filter((id) => {
      if (!id) return false;
      if (plantPestObjectIds.has(id)) return false;
      if (catalogIds.has(id)) return false;
      if (PEST_CATALOG[id]) return false;
      if (requestedPestIdsRef.current.has(id)) return false;
      if (notFoundPestIdsRef.current.has(id)) return false;
      return true;
    });

    if (missingIds.length === 0) return;

    missingIds.forEach((id) => requestedPestIdsRef.current.add(id));

    void (async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            return await getPestDocument(id);
          } catch (error) {
            console.warn('No se pudo resolver la plaga por ID', { pestId: id, error });
            notFoundPestIdsRef.current.add(id);
            return null;
          }
        }),
      );

      const resolved = results.filter((item): item is Pest => Boolean(item));
      if (resolved.length === 0) return;

      setPestsCatalog((prev) => {
        const known = new Map(prev.map((item) => [item.id, item] as const));
        resolved.forEach((item) => known.set(item.id, item));
        return Array.from(known.values());
      });
    })();
  }, [visible, isPestsVisible, plant, pestsCatalog]);

  if (!plant) {
    return null;
  }

  const pestIds =
    Array.isArray(plant?.pestIds) && plant.pestIds.length > 0
      ? plant.pestIds
      : normalizeIdArray(plant?.pests);
  const pestsCount = pestIds.length;

  const careTypeIds =
    Array.isArray(plant?.careTypeIds) && plant.careTypeIds.length > 0
      ? plant.careTypeIds
      : normalizeIdArray(plant?.careTypes);
  const careTypesCount = careTypeIds.length;

  const plantPestsMap = new Map(
    (Array.isArray(plant?.pests) ? plant.pests : [])
      .map((item) => (typeof item === 'string' ? null : item))
      .filter(Boolean)
      .map((item) => [(item as Pest).id, item as Pest] as const),
  );

  const plantCareTypesMap = new Map(
    (Array.isArray(plant?.careTypes) ? plant.careTypes : [])
      .map((item) => (typeof item === 'string' ? null : item))
      .filter(Boolean)
      .map((item) => [(item as CareType).id, item as CareType] as const),
  );

  const pestsCatalogMap = new Map(pestsCatalog.map((item) => [item.id, item] as const));

  const availablePests = (pestsCatalog.length > 0
    ? pestsCatalog
    : Object.entries(PEST_CATALOG).map(([id, info]) => ({ id, ...info })))
    .filter((item) => !pestIds.includes(item.id));

  const availableCareTypes = careTypesCatalog.filter((item) => !careTypeIds.includes(item.id));

  const getCareTypeInfo = (careTypeId: string): CareTypeInfo => {
    const fromPlant = plantCareTypesMap.get(careTypeId);
    if (fromPlant) {
      return {
        id: fromPlant.id,
        name: fromPlant.name ?? fromPlant.id,
        description: fromPlant.description ?? '—',
      };
    }

    const info = careTypesCatalog.find((item) => item.id === careTypeId);
    if (!info) {
      return {
        id: careTypeId,
        name: careTypeId,
        description: 'Información no disponible por el momento.',
      };
    }
    return {
      id: careTypeId,
      name: info.name,
      description: info.description ?? '—',
    };
  };

  const ensureCareTypesLoaded = async () => {
    if (isCareTypesLoading) return;
    if (careTypesCatalog.length > 0) return;

    try {
      setIsCareTypesLoading(true);
      setCareTypesError(null);
      const result = await getCareTypes();
      setCareTypesCatalog(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error cargando tipos de cuidado', error);
      setCareTypesCatalog([]);
      setCareTypesError('No pudimos cargar los tipos de cuidado desde la API.');

      const message =
        error instanceof ApiValidationError
          ? 'La API devolvió datos inválidos.'
          : error instanceof ApiError
            ? error.message
            : 'No pudimos cargar los tipos de cuidado.';
      showToast({ kind: 'error', title: 'Error', message });
    } finally {
      setIsCareTypesLoading(false);
    }
  };

  const ensurePestsLoaded = async () => {
    if (isPestsLoading) return;
    if (pestsCatalog.length > 0) return;

    try {
      setIsPestsLoading(true);
      setPestsError(null);
      const result = await getPests();
      setPestsCatalog(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error cargando plagas', error);
      setPestsCatalog([]);
      setPestsError('No pudimos cargar las plagas desde la API.');

      const message =
        error instanceof ApiValidationError
          ? 'La API devolvió datos inválidos.'
          : error instanceof ApiError
            ? error.message
            : 'No pudimos cargar las plagas.';
      showToast({ kind: 'error', title: 'Error', message });
    } finally {
      setIsPestsLoading(false);
    }
  };


  const getPestInfo = (pestId: string): PestInfo => {
    const fromPlant = plantPestsMap.get(pestId);
    if (fromPlant) {
      return {
        id: fromPlant.id,
        name: fromPlant.name ?? fromPlant.id,
        scientificName: fromPlant.scientificName ?? '—',
        dangerLevel: fromPlant.dangerLevel ?? '—',
        description: fromPlant.description ?? '—',
        treatment: fromPlant.treatment ?? '—',
      };
    }

    const fromApi = pestsCatalogMap.get(pestId);
    if (fromApi) {
      return {
        id: fromApi.id,
        name: fromApi.name ?? fromApi.id,
        scientificName: fromApi.scientificName ?? '—',
        dangerLevel: fromApi.dangerLevel ?? '—',
        description: fromApi.description ?? '—',
        treatment: fromApi.treatment ?? '—',
      };
    }

    const info = PEST_CATALOG[pestId];
    if (info) return { id: pestId, ...info };

    return {
      id: pestId,
      name: pestId,
      scientificName: '—',
      dangerLevel: '—',
      description: 'Información no disponible por el momento.',
      treatment: '—',
    };
  };

  const isPestResolved = (pestId: string) =>
    plantPestsMap.has(pestId) || pestsCatalogMap.has(pestId) || Boolean(PEST_CATALOG[pestId]);

  const unresolvedPestIds = pestIds.filter((id) => !isPestResolved(id));

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
              const nextPests = pestIds.filter((id) => id !== pestId);
              const nextStatus = nextPests.length > 0 ? 'Enferma' : 'Saludable';

              const updated = await updatePlant(plant.id, {
                pests: nextPests,
                status: nextStatus,
              });
              onPlantUpdated(updated);

                  showToast({
                    kind: 'success',
                    title: 'Listo',
                    message: 'Eliminamos la plaga de tu planta.',
                  });
            } catch (error) {
              console.error('Error eliminando plaga', error);
                  const message =
                    error instanceof ApiValidationError
                      ? 'La API devolvió datos inválidos.'
                      : error instanceof ApiError
                        ? error.message
                        : 'No pudimos eliminar la plaga.';
                  showToast({ kind: 'error', title: 'Error', message });
            }
          },
        },
      ],
    );
  };

  const handleAddPest = async (pestId: string) => {
    try {
      const nextPests = Array.from(new Set([...pestIds, pestId]));
      const nextStatus = nextPests.length > 0 ? 'Enferma' : 'Saludable';

      const updated = await updatePlant(plant.id, {
        pests: nextPests,
        status: nextStatus,
      });
      onPlantUpdated(updated);
      setIsAddPestVisible(false);
      showToast({ kind: 'success', title: 'Listo', message: 'Agregamos la plaga a tu planta.' });
    } catch (error) {
      console.error('Error agregando plaga', error);
      const message =
        error instanceof ApiValidationError
          ? 'La API devolvió datos inválidos.'
          : error instanceof ApiError
            ? error.message
            : 'No pudimos agregar la plaga.';
      showToast({ kind: 'error', title: 'Error', message });
    }
  };

  const handleAddCareType = async (careTypeId: string) => {
    try {
      const nextCareTypes = Array.from(new Set([...careTypeIds, careTypeId]));

      const updated = await updatePlant(plant.id, {
        careTypes: nextCareTypes,
      });
      onPlantUpdated(updated);
      setIsAddCareTypeVisible(false);
      showToast({ kind: 'success', title: 'Listo', message: 'Agregamos el tipo de cuidado a tu planta.' });
    } catch (error) {
      console.error('Error agregando tipo de cuidado', error);
      const message =
        error instanceof ApiValidationError
          ? 'La API devolvió datos inválidos.'
          : error instanceof ApiError
            ? error.message
            : 'No pudimos agregar el tipo de cuidado.';
      showToast({ kind: 'error', title: 'Error', message });
    }
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
      const price = values.price.trim() ? Number(values.price.replace(',', '.')) : undefined;
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
        wateringIntervalDays: values.wateringIntervalDays ? Number(values.wateringIntervalDays) : null,
        wateringFrequencyDays: values.wateringFrequencyDays ? Number(values.wateringFrequencyDays) : null,
        wateringNotes: values.wateringNotes.trim() ? values.wateringNotes.trim() : null,
        careTypes,
        status: nextStatus,
      });
      onPlantUpdated(updatedPlant);
      showToast({ kind: 'success', title: 'Listo', message: 'Guardamos los cambios de tu planta.' });
    } catch (error) {
      console.error('Error actualizando planta', error);
      const message =
        error instanceof ApiValidationError
          ? 'La API devolvió datos inválidos.'
          : error instanceof ApiError
            ? error.message
            : 'No pudimos guardar los cambios.';
      showToast({ kind: 'error', title: 'Error', message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlant = () => {
    Alert.alert(
      'Eliminar planta',
      'Esta seguro de eliminar la planta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlant(plant.id);
              onPlantDeleted?.(plant.id);
              onClose();
              showToast({ kind: 'success', title: 'Listo', message: 'Eliminamos la planta.' });
            } catch (error) {
              console.error('Error eliminando planta', error);
              const message =
                error instanceof ApiValidationError
                  ? 'La API devolvió datos inválidos.'
                  : error instanceof ApiError
                    ? error.message
                    : 'No pudimos eliminar la planta.';
              showToast({ kind: 'error', title: 'Error', message });
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ToastViewport />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                marginRight: theme.spacing.md,
                padding: theme.spacing.xs,
              }}
              accessibilityLabel="Volver"
              accessibilityRole="button"
            >
              <Feather name="chevron-left" size={28} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: theme.typography.size.xxl,
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.foreground,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {plant.name}
            </Text>
          </View>

          {/* Sección de Imagen */}
          <View
            style={{
              width: '100%',
              height: 250,
              backgroundColor: theme.colors.muted,
              borderRadius: theme.radius.xl,
              marginBottom: theme.spacing.xl,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            {plant.imageUrl || plant.image ? (
              <Image
                source={{ uri: plant.imageUrl || plant.image || '' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Feather name="image" size={48} color={theme.colors.mutedForeground} style={{ marginBottom: theme.spacing.sm }} />
                <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.typography.fontFamily.default }}>
                  No cuenta con una imagen
                </Text>
              </View>
            )}
          </View>

          <PlantDetailForm
            plant={plant}
            categories={categories}
            pestsCount={pestsCount}
            onOpenPests={() => {
              setIsPestsVisible(true);
              void ensurePestsLoaded();
            }}
            careTypesCount={careTypesCount}
            onOpenCareTypes={async () => {
              setIsCareTypesVisible(true);
              await ensureCareTypesLoaded();
            }}
            onSave={handleSave}
            onDeletePress={handleDeletePlant}
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
          <ToastViewport />
          <ModalHeader
            title="Plagas"
            subtitle={
              pestsCount > 0
                ? `${pestsCount} ${pestsCount === 1 ? 'registro' : 'registros'}`
                : 'Sin plagas registradas'
            }
            onRightAction={() => {
              setIsAddPestVisible(true);
              void ensurePestsLoaded();
            }}
            rightActionA11yLabel="Agregar plaga"
          />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}
          >
            {unresolvedPestIds.length > 0 ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text
                  style={{
                    fontSize: theme.typography.size.base,
                    color: theme.colors.foreground,
                    fontFamily: theme.typography.fontFamily.semibold,
                  }}
                >
                  Hay plagas sin información
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, marginTop: theme.spacing.xs }}>
                  IDs: {unresolvedPestIds.join(', ')}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground, marginTop: theme.spacing.xs }}>
                  Revisá que existan como documentos en la colección "pests" (mismo id) o que el endpoint /api/pests/{'{id}'} esté accesible.
                </Text>
              </InfoCard>
            ) : null}

            {isPestsLoading ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ color: theme.colors.foreground }}>Cargando plagas...</Text>
              </InfoCard>
            ) : null}

            {pestsError ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ color: theme.colors.foreground }}>{pestsError}</Text>
              </InfoCard>
            ) : null}

            {pestsCount === 0 ? (
              <InfoCard>
                <Text
                  style={{
                    fontSize: theme.typography.size.base,
                    color: theme.colors.foreground,
                    fontFamily: theme.typography.fontFamily.default,
                  }}
                >
                  No hay plagas registradas en esta planta.
                </Text>
              </InfoCard>
            ) : (
              pestIds.map((pestId: string) => {
                const info = getPestInfo(pestId);
                return (
                  <InfoCard key={pestId} style={{ marginBottom: theme.spacing.lg }}>
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
                  </InfoCard>
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

      <Modal
        visible={isAddPestVisible}
        animationType="slide"
        onRequestClose={() => setIsAddPestVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ToastViewport />
          <ModalHeader
            title="Agregar plaga"
            subtitle="Elegí una plaga para agregarla a esta planta."
          />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}
          >
            {isPestsLoading ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ color: theme.colors.foreground }}>Cargando plagas...</Text>
              </InfoCard>
            ) : null}

            {pestsError ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ color: theme.colors.foreground }}>{pestsError}</Text>
              </InfoCard>
            ) : null}

            {!isPestsLoading && availablePests.length === 0 ? (
              <InfoCard>
                <Text style={{ color: theme.colors.foreground }}>No hay más plagas disponibles para agregar.</Text>
              </InfoCard>
            ) : null}

            {availablePests.map((item) => {
              const info = getPestInfo(item.id);
              return (
                <AddItemCard
                  key={item.id}
                  title={info.name}
                  subtitle={info.scientificName}
                  onPress={() => handleAddPest(item.id)}
                  accessibilityLabel={`Agregar plaga ${info.name}`}
                />
              );
            })}

            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setIsAddPestVisible(false)}
              style={{ marginTop: theme.spacing.md }}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={isCareTypesVisible}
        animationType="slide"
        onRequestClose={() => setIsCareTypesVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ToastViewport />
          <ModalHeader
            title="Tipos de cuidado"
            subtitle={
              careTypesCount > 0
                ? `${careTypesCount} ${careTypesCount === 1 ? 'registro' : 'registros'}`
                : 'Sin tipos de cuidado'
            }
            onRightAction={() => {
              setIsAddCareTypeVisible(true);
              void ensureCareTypesLoaded();
            }}
            rightActionA11yLabel="Agregar tipo de cuidado"
          />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}
          >
            {isCareTypesLoading ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text
                  style={{
                    fontSize: theme.typography.size.base,
                    color: theme.colors.foreground,
                    fontFamily: theme.typography.fontFamily.default,
                  }}
                >
                  Cargando tipos de cuidado...
                </Text>
              </InfoCard>
            ) : null}

            {careTypesError ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text
                  style={{
                    fontSize: theme.typography.size.base,
                    color: theme.colors.foreground,
                    fontFamily: theme.typography.fontFamily.default,
                  }}
                >
                  {careTypesError}
                </Text>
              </InfoCard>
            ) : null}

            {careTypesCount === 0 ? (
              <InfoCard>
                <Text
                  style={{
                    fontSize: theme.typography.size.base,
                    color: theme.colors.foreground,
                    fontFamily: theme.typography.fontFamily.default,
                  }}
                >
                  No hay tipos de cuidado registrados en esta planta.
                </Text>
              </InfoCard>
            ) : (
              careTypeIds.map((careTypeId) => {
                const info = getCareTypeInfo(careTypeId);
                return (
                  <InfoCard key={careTypeId} style={{ marginBottom: theme.spacing.lg }}>
                    <Text
                      style={{
                        fontSize: theme.typography.size.lg,
                        color: theme.colors.foreground,
                        fontFamily: theme.typography.fontFamily.bold,
                      }}
                    >
                      {info.name}
                    </Text>

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
                  </InfoCard>
                );
              })
            )}

            <Button
              title="Volver"
              variant="secondary"
              onPress={() => setIsCareTypesVisible(false)}
              style={{ marginTop: theme.spacing.md }}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={isAddCareTypeVisible}
        animationType="slide"
        onRequestClose={() => setIsAddCareTypeVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ToastViewport />
          <ModalHeader
            title="Agregar tipo de cuidado"
            subtitle="Elegí un tipo de cuidado para agregarlo a esta planta."
          />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}
          >
            {isCareTypesLoading ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ color: theme.colors.foreground }}>Cargando tipos de cuidado...</Text>
              </InfoCard>
            ) : null}

            {careTypesError ? (
              <InfoCard style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ color: theme.colors.foreground }}>{careTypesError}</Text>
              </InfoCard>
            ) : null}

            {!isCareTypesLoading && !careTypesError && availableCareTypes.length === 0 ? (
              <InfoCard>
                <Text style={{ color: theme.colors.foreground }}>
                  No hay más tipos de cuidado disponibles para agregar.
                </Text>
              </InfoCard>
            ) : null}

            {availableCareTypes.map((item) => (
              <AddItemCard
                key={item.id}
                title={item.name}
                subtitle={item.description ?? '—'}
                onPress={() => handleAddCareType(item.id)}
                accessibilityLabel={`Agregar tipo de cuidado ${item.name}`}
              />
            ))}

            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setIsAddCareTypeVisible(false)}
              style={{ marginTop: theme.spacing.md }}
            />
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}
