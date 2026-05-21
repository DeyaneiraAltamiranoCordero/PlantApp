import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View, Text, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Category, Plant } from '../../context/services/api';
import { Button } from '../ui/Button';
import { BooleanSwitchRow } from '../ui/BooleanSwitchRow';
import { CatalogSummaryCard } from '../ui/CatalogSummaryCard';
import { SelectBox } from '../ui/SelectBox';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';
import { AppTheme } from '../../theme/desingSystem';
import { useToast } from '../../context/ToastContext';
import { PlantCareDateInputSchema, PlantPriceInputSchema } from '../../context/services/schemas';

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatIsoToDisplayDate = (rawIso: string): string => {
  const iso = rawIso.trim();
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return rawIso;
  }

  const day = pad2(date.getUTCDate());
  const month = pad2(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const parseDisplayDateToIso = (rawDisplay: string): string | null => {
  const display = rawDisplay.trim();
  if (!display) return '';

  // DD/MM/YYYY or DD-MM-YYYY
  const dmY = display.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmY) {
    const day = Number(dmY[1]);
    const month = Number(dmY[2]);
    const year = Number(dmY[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
    if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    // Use midday UTC to avoid timezone date shifting on display.
    const iso = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)).toISOString();
    return iso;
  }

  // YYYY-MM-DD
  const yMd = display.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yMd) {
    const year = Number(yMd[1]);
    const month = Number(yMd[2]);
    const day = Number(yMd[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
    if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)).toISOString();
  }

  // If the user pastes an ISO string, accept it.
  const parsed = new Date(display);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return null;
};

export type PlantDetailFormValues = {
  name: string;
  categoryIds: string[];
  age: string;
  flowering: string;
  growthTime: string;
  height: string;
  price: string;
  toxic: boolean;
  toxicTo: string;

  description: string;
  notes: string;

  lightPreference: string;
  temperature: string;
  fertilizerType: string;
  lastFertilized: string;
  lastWatered: string;
  wateringIntervalDays: string;
  careTypes: string;
};

interface PlantDetailFormProps {
  plant: Plant;
  categories: Category[];
  pestsCount: number;
  onOpenPests: () => void;
  careTypesCount: number;
  onOpenCareTypes: () => void;
  onSave: (values: PlantDetailFormValues) => Promise<void>;
  loading?: boolean;
}

export function PlantDetailForm({
  plant,
  categories,
  pestsCount,
  onOpenPests,
  careTypesCount,
  onOpenCareTypes,
  onSave,
  loading,
}: PlantDetailFormProps) {
  const { theme } = usePlantCareStyles();
  const { showToast } = useToast();
  const formStyles = useMemo(() => createFormStyles(theme), [theme]);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'price' | 'lastFertilized' | 'lastWatered' | 'wateringIntervalDays', string>>>({});

  const initialCategoryIds =
    Array.isArray(plant.categoryIds) && plant.categoryIds.length > 0
      ? plant.categoryIds
      : plant.categoryId
        ? [plant.categoryId]
        : [];

  const initialCareTypeIds =
    Array.isArray(plant.careTypeIds) && plant.careTypeIds.length > 0
      ? plant.careTypeIds
      : Array.isArray(plant.careTypes)
        ? plant.careTypes
            .map((item) => (typeof item === 'string' ? item : item?.id))
            .filter(Boolean)
        : [];

  const [values, setValues] = useState<PlantDetailFormValues>({
    name: plant.name,
    categoryIds: initialCategoryIds,
    age: plant.age || '',
    flowering: plant.flowering || '',
    growthTime: plant.growthTime || '',
    height: plant.height || '',
    price: typeof plant.price === 'number' ? String(plant.price) : '',
    toxic: Boolean(plant.toxic),
    toxicTo: plant.toxicTo || '',
    description: plant.description || '',
    notes: plant.notes || '',
    lightPreference: plant.lightPreference || '',
    temperature: plant.temperature || '',
    fertilizerType: plant.fertilizerType || '',
    lastFertilized: plant.lastFertilized || '',
    lastWatered: plant.lastWatered || '',
    wateringIntervalDays:
      typeof plant.wateringIntervalDays === 'number' && Number.isFinite(plant.wateringIntervalDays)
        ? String(plant.wateringIntervalDays)
        : '',
    careTypes: initialCareTypeIds.join(', '),
  });

  const [displayLastFertilized, setDisplayLastFertilized] = useState(() =>
    formatIsoToDisplayDate(plant.lastFertilized || ''),
  );
  const [displayLastWatered, setDisplayLastWatered] = useState(() =>
    formatIsoToDisplayDate(plant.lastWatered || ''),
  );

  const [summaryCategoryId, setSummaryCategoryId] = useState<string>(initialCategoryIds[0] ?? '');

  const selectedCategories = useMemo(() => {
    const known = new Map(categories.map((cat) => [cat.id, cat]));
    return values.categoryIds.map((id) => {
      const match = known.get(id);
      if (match) return match;
      return { id, name: id, description: undefined };
    });
  }, [categories, values.categoryIds]);

  const summaryCategory = useMemo(
    () => selectedCategories.find((cat) => cat.id === summaryCategoryId),
    [selectedCategories, summaryCategoryId],
  );

  const addCategory = (categoryId: string) => {
    setValues((prev) => {
      if (prev.categoryIds.includes(categoryId)) return prev;
      return { ...prev, categoryIds: [...prev.categoryIds, categoryId] };
    });
    setSummaryCategoryId(categoryId);
  };

  const handleChange = (field: keyof PlantDetailFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    if (field === 'price') {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  };

  const handleToggle = (field: keyof PlantDetailFormValues, value: boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const priceValidation = PlantPriceInputSchema.safeParse(values.price);
    if (!priceValidation.success) {
      const message =
        priceValidation.error.issues[0]?.message ?? 'Precio inválido.';
      setErrors((prev) => ({ ...prev, price: message }));
      showToast({
        kind: 'warning',
        title: 'Aviso',
        message,
      });
      return;
    }

    const lastFertilizedInput = displayLastFertilized.trim();
    const lastWateredInput = displayLastWatered.trim();

    const fertilizedValidation = PlantCareDateInputSchema.safeParse(lastFertilizedInput);
    if (!fertilizedValidation.success) {
      const message = fertilizedValidation.error.issues[0]?.message ?? 'Fecha inválida.';
      setErrors((prev) => ({ ...prev, lastFertilized: message }));
      showToast({
        kind: 'warning',
        title: 'Aviso',
        message: `Última fertilización: ${message}`,
      });
      return;
    }

    setErrors((prev) => ({ ...prev, lastFertilized: undefined }));

    const wateredValidation = PlantCareDateInputSchema.safeParse(lastWateredInput);
    if (!wateredValidation.success) {
      const message = wateredValidation.error.issues[0]?.message ?? 'Fecha inválida.';
      setErrors((prev) => ({ ...prev, lastWatered: message }));
      showToast({
        kind: 'warning',
        title: 'Aviso',
        message: `Último riego: ${message}`,
      });
      return;
    }

    setErrors((prev) => ({ ...prev, lastWatered: undefined }));

    const nextLastFertilized = parseDisplayDateToIso(displayLastFertilized);
    const nextLastWatered = parseDisplayDateToIso(displayLastWatered);

    // Should not happen if Zod validation above passed, but keep it safe.
    if (lastFertilizedInput && nextLastFertilized === null) {
      showToast({
        kind: 'warning',
        title: 'Aviso',
        message: 'Última fertilización: Fecha inválida. Usá DD/MM/AAAA o YYYY-MM-DD.',
      });
      return;
    }

    if (lastWateredInput && nextLastWatered === null) {
      showToast({
        kind: 'warning',
        title: 'Aviso',
        message: 'Último riego: Fecha inválida. Usá DD/MM/AAAA o YYYY-MM-DD.',
      });
      return;
    }

    const wateringIntervalInput = values.wateringIntervalDays.trim();
    let wateringIntervalDays: number | undefined;
    if (wateringIntervalInput) {
      if (!/^\d+$/.test(wateringIntervalInput)) {
        setErrors((prev) => ({
          ...prev,
          wateringIntervalDays: 'Usá un número entero positivo.',
        }));
        showToast({
          kind: 'warning',
          title: 'Aviso',
          message: 'La frecuencia de riego debe ser un número entero positivo.',
        });
        return;
      }

      wateringIntervalDays = Number(wateringIntervalInput);
      if (!Number.isFinite(wateringIntervalDays) || wateringIntervalDays < 1) {
        setErrors((prev) => ({
          ...prev,
          wateringIntervalDays: 'Usá un número entero positivo.',
        }));
        showToast({
          kind: 'warning',
          title: 'Aviso',
          message: 'La frecuencia de riego debe ser mayor que cero.',
        });
        return;
      }
    }

    setErrors((prev) => ({ ...prev, wateringIntervalDays: undefined }));

    const normalized: PlantDetailFormValues = {
      ...values,
      price: priceValidation.data,
      lastFertilized: nextLastFertilized === null ? values.lastFertilized : nextLastFertilized,
      lastWatered: nextLastWatered === null ? values.lastWatered : nextLastWatered,
      wateringIntervalDays:
        typeof wateringIntervalDays === 'number' ? String(wateringIntervalDays) : '',
    };

    setValues(normalized);
    setDisplayLastFertilized(formatIsoToDisplayDate(normalized.lastFertilized));
    setDisplayLastWatered(formatIsoToDisplayDate(normalized.lastWatered));

    await onSave(normalized);
  };

  const careTypesCountFromInput = useMemo(() => {
    const ids = values.careTypes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return new Set(ids).size;
  }, [values.careTypes]);

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

      <View style={formStyles.fieldRow}>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Edad</Text>
          <TextInput
            style={formStyles.input}
            value={values.age}
            onChangeText={(text) => handleChange('age', text)}
            placeholder='Ej. 2 años'
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Floración</Text>
          <TextInput
            style={formStyles.input}
            value={values.flowering}
            onChangeText={(text) => handleChange('flowering', text)}
            placeholder='Ej. primavera'
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
      </View>

      <View style={formStyles.fieldRow}>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Tiempo de crecimiento</Text>
          <TextInput
            style={formStyles.input}
            value={values.growthTime}
            onChangeText={(text) => handleChange('growthTime', text)}
            placeholder='Ej. 6 meses'
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Altura</Text>
          <TextInput
            style={formStyles.input}
            value={values.height}
            onChangeText={(text) => handleChange('height', text)}
            placeholder='Ej. 30 cm'
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
      </View>

      <View style={formStyles.fieldRow}>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Precio</Text>
          <TextInput
            style={[
              formStyles.input,
              errors.price ? { borderColor: theme.colors.destructive } : null,
            ]}
            value={values.price}
            onChangeText={(text) => handleChange('price', text)}
            keyboardType="numeric"
            onBlur={() => {
              const parsed = PlantPriceInputSchema.safeParse(values.price);
              if (!parsed.success) {
                const message = parsed.error.issues[0]?.message ?? 'Precio inválido.';
                setErrors((prev) => ({ ...prev, price: message }));
                return;
              }
              setErrors((prev) => ({ ...prev, price: undefined }));
              setValues((prev) => ({ ...prev, price: parsed.data }));
            }}
            placeholder='Ej. 15'
            placeholderTextColor={theme.colors.mutedForeground}
          />
          {errors.price ? <Text style={formStyles.errorText}>{errors.price}</Text> : null}
        </View>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Tóxica</Text>
            <BooleanSwitchRow value={values.toxic} onValueChange={(next) => handleToggle('toxic', next)} />
        </View>
      </View>

      {values.toxic ? (
        <View style={formStyles.fieldGroup}>
          <Text style={formStyles.label}>Tóxica para</Text>
          <TextInput
            style={formStyles.input}
            value={values.toxicTo}
            onChangeText={(text) => handleChange('toxicTo', text)}
            placeholder='Ej. mascotas'
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
      ) : null}

      <View style={[formStyles.sectionHeaderRow, { marginTop: theme.spacing.xl }]}>
        <Text style={formStyles.sectionTitle}>Categorías</Text>
        <TouchableOpacity
          onPress={() => setIsCategoryPickerVisible(true)}
          disabled={categories.length === 0}
          style={[formStyles.headerIconButton, categories.length === 0 && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel="Agregar categoría"
        >
          <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {selectedCategories.length > 0 ? (
        <SelectBox
          text={summaryCategory?.name || selectedCategories[0]?.name}
          isOpen={isCategorySelectOpen}
          onPress={() => setIsCategorySelectOpen((prev) => !prev)}
          accessibilityLabel="Ver categorías seleccionadas"
          leading={<View style={formStyles.greenDot} />}
        />
      ) : (
        <Text style={[formStyles.helperText, { marginTop: theme.spacing.md }]}>
          Sin categorías seleccionadas.
        </Text>
      )}

      {isCategorySelectOpen && selectedCategories.length > 0 ? (
        <View style={formStyles.dropdownContainer}>
          {selectedCategories.map((cat) => {
            const isSelected = cat.id === summaryCategoryId;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  setSummaryCategoryId(cat.id);
                  setIsCategorySelectOpen(false);
                }}
                activeOpacity={0.85}
                style={[
                  formStyles.dropdownItem,
                  isSelected && {
                    borderColor: theme.colors.primary,
                    backgroundColor: `${theme.colors.primary}12`,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Seleccionar ${cat.name}`}
              >
                <View style={formStyles.greenDot} />
                <Text style={formStyles.dropdownItemText} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {summaryCategory ? (
        <View style={[formStyles.readonlyBox, { marginTop: theme.spacing.md }]}>
          <Text style={formStyles.readonlyTitle}>Resumen</Text>
          <View style={{ marginTop: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontFamily: theme.typography.fontFamily.semibold }}>
              {summaryCategory.name}
            </Text>
            <Text style={formStyles.readonlyDescription}>
              {summaryCategory.description || 'Resumen no disponible.'}
            </Text>
          </View>
        </View>
      ) : null}

      <Modal
        visible={isCategoryPickerVisible}
        animationType="slide"
        onRequestClose={() => setIsCategoryPickerVisible(false)}
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
            <Text
              style={{
                fontSize: theme.typography.size.xl,
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.foreground,
                fontFamily: theme.typography.fontFamily.bold,
                flex: 1,
              }}
            >
              Categorías
            </Text>

            <Button title="Cerrar" variant="secondary" onPress={() => setIsCategoryPickerVisible(false)} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}
          >
            {categories.map((cat) => {
              const isSelected = values.categoryIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    addCategory(cat.id);
                    setIsCategoryPickerVisible(false);
                  }}
                  activeOpacity={0.85}
                  style={[
                    formStyles.pickerItem,
                    isSelected && { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}12` },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar categoría ${cat.name}`}
                >
                  <View style={formStyles.greenDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.foreground, fontFamily: theme.typography.fontFamily.semibold }}>
                      {cat.name}
                    </Text>
                    <Text style={formStyles.readonlyDescription} numberOfLines={2}>
                      {cat.description || 'Resumen no disponible.'}
                    </Text>
                  </View>
                  <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      <Text style={[formStyles.sectionTitle, { marginTop: theme.spacing.xl }]}>Información adicional</Text>
      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Notas</Text>
        <TextInput
          style={[formStyles.input, formStyles.textArea]}
          multiline
          value={values.notes}
          onChangeText={(text) => handleChange('notes', text)}
          placeholder="Notas adicionales"
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
          placeholder="Descripción de la planta"
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
            placeholder="Luz indirecta"
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

      <View style={formStyles.fieldRow}>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Tipo de fertilizante</Text>
          <TextInput
            style={formStyles.input}
            value={values.fertilizerType}
            onChangeText={(text) => handleChange('fertilizerType', text)}
            placeholder="Ej. Fertilizante líquido"
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Última fertilización</Text>
          <TextInput
            style={[
              formStyles.input,
              errors.lastFertilized ? { borderColor: theme.colors.destructive } : null,
            ]}
            value={displayLastFertilized}
            onChangeText={(text) => {
              setDisplayLastFertilized(text);
              setErrors((prev) => ({ ...prev, lastFertilized: undefined }));
            }}
            onBlur={() => {
              const validation = PlantCareDateInputSchema.safeParse(displayLastFertilized.trim());
              if (!validation.success) {
                const message = validation.error.issues[0]?.message ?? 'Fecha inválida.';
                setErrors((prev) => ({ ...prev, lastFertilized: message }));
                return;
              }

              const parsed = parseDisplayDateToIso(displayLastFertilized);
              if (parsed === null) {
                setErrors((prev) => ({
                  ...prev,
                  lastFertilized: 'Fecha inválida. Usá DD/MM/AAAA o YYYY-MM-DD.',
                }));
                return;
              }
              setValues((prev) => ({ ...prev, lastFertilized: parsed }));
              setDisplayLastFertilized(formatIsoToDisplayDate(parsed));
              setErrors((prev) => ({ ...prev, lastFertilized: undefined }));
            }}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={theme.colors.mutedForeground}
          />
          {errors.lastFertilized ? <Text style={formStyles.errorText}>{errors.lastFertilized}</Text> : null}
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Último riego</Text>
        <TextInput
          style={[
            formStyles.input,
            errors.lastWatered ? { borderColor: theme.colors.destructive } : null,
          ]}
          value={displayLastWatered}
          onChangeText={(text) => {
            setDisplayLastWatered(text);
            setErrors((prev) => ({ ...prev, lastWatered: undefined }));
          }}
          onBlur={() => {
            const validation = PlantCareDateInputSchema.safeParse(displayLastWatered.trim());
            if (!validation.success) {
              const message = validation.error.issues[0]?.message ?? 'Fecha inválida.';
              setErrors((prev) => ({ ...prev, lastWatered: message }));
              return;
            }

            const parsed = parseDisplayDateToIso(displayLastWatered);
            if (parsed === null) {
              setErrors((prev) => ({
                ...prev,
                lastWatered: 'Fecha inválida. Usá DD/MM/AAAA o YYYY-MM-DD.',
              }));
              return;
            }
            setValues((prev) => ({ ...prev, lastWatered: parsed }));
            setDisplayLastWatered(formatIsoToDisplayDate(parsed));
            setErrors((prev) => ({ ...prev, lastWatered: undefined }));
          }}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={theme.colors.mutedForeground}
        />
        {errors.lastWatered ? <Text style={formStyles.errorText}>{errors.lastWatered}</Text> : null}
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Frecuencia de riego</Text>
        <TextInput
          style={[
            formStyles.input,
            errors.wateringIntervalDays ? { borderColor: theme.colors.destructive } : null,
          ]}
          value={values.wateringIntervalDays}
          onChangeText={(text) => {
            setValues((prev) => ({ ...prev, wateringIntervalDays: text }));
            setErrors((prev) => ({ ...prev, wateringIntervalDays: undefined }));
          }}
          onBlur={() => {
            const trimmed = values.wateringIntervalDays.trim();
            if (!trimmed) {
              setErrors((prev) => ({ ...prev, wateringIntervalDays: undefined }));
              return;
            }

            if (!/^\d+$/.test(trimmed) || Number(trimmed) < 1) {
              setErrors((prev) => ({
                ...prev,
                wateringIntervalDays: 'Usá un número entero positivo.',
              }));
              return;
            }

            setValues((prev) => ({ ...prev, wateringIntervalDays: String(Number(trimmed)) }));
            setErrors((prev) => ({ ...prev, wateringIntervalDays: undefined }));
          }}
          keyboardType="number-pad"
          placeholder="Ej. 7"
          placeholderTextColor={theme.colors.mutedForeground}
        />
        <Text style={formStyles.helperText}>Cada cuántos días se debe regar esta planta.</Text>
        {errors.wateringIntervalDays ? (
          <Text style={formStyles.errorText}>{errors.wateringIntervalDays}</Text>
        ) : null}
      </View>

      <View style={formStyles.fieldGroup}>
        <CatalogSummaryCard
          style={{ marginTop: theme.spacing.md }}
          title="Tipos cuidados"
          description={
            careTypesCountFromInput > 0
              ? `${careTypesCountFromInput} ${careTypesCountFromInput === 1 ? 'tipo' : 'tipos'} de cuidado asignados`
              : 'No hay tipos de cuidado asignados.'
          }
          onView={careTypesCountFromInput > 0 ? onOpenCareTypes : undefined}
          viewDisabled={careTypesCountFromInput === 0}
          viewA11yLabel="Ver lista de tipos de cuidado"
          onAdd={undefined}
          addDisabled
          addA11yLabel="Agregar tipo de cuidado"
        />
      </View>

      <Text style={[formStyles.sectionTitle, { marginTop: theme.spacing.xl }]}>Plagas</Text>
      <CatalogSummaryCard
        title="Plagas registradas"
        description={
          pestsCount > 0
            ? `${pestsCount} ${pestsCount === 1 ? 'plaga' : 'plagas'} en esta planta`
            : 'No hay plagas registradas.'
        }
        onView={pestsCount > 0 ? onOpenPests : undefined}
        viewDisabled={pestsCount === 0}
        viewA11yLabel="Ver lista de plagas"
        onAdd={undefined}
        addDisabled
        addA11yLabel="Agregar plaga"
      />

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
    errorText: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.size.sm,
      color: theme.colors.destructive,
      fontFamily: theme.typography.fontFamily.default,
    },
    helperText: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
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
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    greenDot: {
      width: 10,
      height: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    tagText: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.default,
    },
    dropdownContainer: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.muted,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dropdownItemText: {
      flex: 1,
      fontSize: theme.typography.size.base,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.default,
    },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    readonlyBox: {
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    readonlyTitle: {
      fontSize: theme.typography.size.base,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    readonlyDescription: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.size.sm,
      color: theme.colors.mutedForeground,
      fontFamily: theme.typography.fontFamily.default,
    },
  });
}
