import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View, Text, TextInput, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Category, Plant } from '../../context/services/api';
import { Button } from '../ui/Button';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';
import { AppTheme } from '../../theme/desingSystem';

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
  careTypes: string;
};

interface PlantDetailFormProps {
  plant: Plant;
  categories: Category[];
  pestsCount: number;
  onOpenPests: () => void;
  onSave: (values: PlantDetailFormValues) => Promise<void>;
  loading?: boolean;
}

export function PlantDetailForm({
  plant,
  categories,
  pestsCount,
  onOpenPests,
  onSave,
  loading,
}: PlantDetailFormProps) {
  const { theme } = usePlantCareStyles();
  const formStyles = useMemo(() => createFormStyles(theme), [theme]);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);

  const initialCategoryIds =
    Array.isArray(plant.categoryIds) && plant.categoryIds.length > 0
      ? plant.categoryIds
      : plant.categoryId
        ? [plant.categoryId]
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
    careTypes: Array.isArray(plant.careTypes) ? plant.careTypes.join(', ') : '',
  });

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
  };

  const handleToggle = (field: keyof PlantDetailFormValues, value: boolean) => {
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
            style={formStyles.input}
            value={values.price}
            onChangeText={(text) => handleChange('price', text)}
            keyboardType="numeric"
            placeholder='Ej. 15'
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
        <View style={formStyles.fieldHalf}>
          <Text style={formStyles.label}>Tóxica</Text>
          <View style={formStyles.switchRow}>
            <Switch
              value={values.toxic}
              onValueChange={(next) => handleToggle('toxic', next)}
              trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
            <Text style={formStyles.switchText}>{values.toxic ? 'Sí' : 'No'}</Text>
          </View>
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
        <TouchableOpacity
          onPress={() => setIsCategorySelectOpen((prev) => !prev)}
          activeOpacity={0.85}
          style={formStyles.selectBox}
          accessibilityRole="button"
          accessibilityLabel="Ver categorías seleccionadas"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
            <View style={formStyles.greenDot} />
            <Text style={formStyles.selectBoxText} numberOfLines={1}>
              {summaryCategory?.name || selectedCategories[0]?.name}
            </Text>
          </View>
          <Feather
            name={isCategorySelectOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.mutedForeground}
          />
        </TouchableOpacity>
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
            style={formStyles.input}
            value={values.lastFertilized}
            onChangeText={(text) => handleChange('lastFertilized', text)}
            placeholder="2026-02-15T08:00:00.000Z"
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Último riego</Text>
        <TextInput
          style={formStyles.input}
          value={values.lastWatered}
          onChangeText={(text) => handleChange('lastWatered', text)}
          placeholder="2026-03-01T08:00:00.000Z"
          placeholderTextColor={theme.colors.mutedForeground}
        />
      </View>

      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>Tipos de cuidado (separados por coma)</Text>
        <TextInput
          style={formStyles.input}
          value={values.careTypes}
          onChangeText={(text) => handleChange('careTypes', text)}
          placeholder="car-1, car-2"
          placeholderTextColor={theme.colors.mutedForeground}
        />
      </View>

      <Text style={[formStyles.sectionTitle, { marginTop: theme.spacing.xl }]}>Plagas</Text>
      <View style={formStyles.readonlyBox}>
        <View style={formStyles.pestsRow}>
          <View style={{ flex: 1 }}>
            <Text style={formStyles.readonlyTitle}>Plagas registradas</Text>
            <Text style={formStyles.readonlyDescription}>
              {pestsCount > 0
                ? `${pestsCount} ${pestsCount === 1 ? 'plaga' : 'plagas'} en esta planta`
                : 'No hay plagas registradas.'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={pestsCount > 0 ? onOpenPests : undefined}
            disabled={pestsCount === 0}
            activeOpacity={0.85}
            style={[formStyles.pestsAction, pestsCount === 0 && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel="Ver lista de plagas"
          >
            <Text style={formStyles.pestsActionText}>Ver lista</Text>
            <Feather name="chevron-right" size={18} color={theme.colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            disabled
            style={[formStyles.pestsPlus, { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel="Agregar plaga"
          >
            <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        </View>
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
    selectBox: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    selectBoxText: {
      fontSize: theme.typography.size.base,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.default,
      flexShrink: 1,
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
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    switchText: {
      fontSize: theme.typography.size.base,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.default,
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
    pestsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    pestsAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pestsActionText: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    pestsPlus: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
