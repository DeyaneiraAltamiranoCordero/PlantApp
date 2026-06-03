import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Barometer } from 'expo-sensors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  getUserProfile,
  updatePlant,
  WateringReminderPlant,
} from '../../context/services/api';
import { useTheme } from '../../theme/desingSystem';
import { createHomeStyles } from './Home.styles';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type WeatherState = 'default' | 'sunny' | 'rain' | 'storm' | 'humid';

const WEATHER_MESSAGES: Record<WeatherState, string> = {
  default: 'Cuida tus plantas hoy 🌿',
  sunny: 'Buen día para tus plantas ☀️',
  rain: 'Se acerca lluvia, considera no regar hoy 🌧️',
  storm: 'Tormenta en camino, protege tus plantas de exterior ⛈️',
  humid: 'Clima húmedo, revisa el drenaje de tus plantas 💧',
};

const WEATHER_ICONS: Record<WeatherState, keyof typeof Feather.glyphMap> = {
  default: 'feather',
  sunny: 'sun',
  rain: 'cloud-rain',
  storm: 'cloud-lightning',
  humid: 'cloud-drizzle',
};

const HIGH_PRESSURE_HPA = 1013;
const LOW_PRESSURE_HPA = 1000;
const STABLE_DELTA_HPA = 0.25;
const MODERATE_DROP_HPA = -0.35;
const SHARP_DROP_HPA = -1.1;

const hexToRgba = (hexColor: string, alpha: number) => {
  const normalized = hexColor.replace('#', '');

  if (![3, 6].includes(normalized.length)) {
    return hexColor;
  }

  const expanded = normalized.length === 3
    ? normalized
        .split('')
        .map((character) => character + character)
        .join('')
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return hexColor;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const getWeatherState = (pressure: number, previousPressure: number | null): WeatherState => {
  if (previousPressure === null) {
    return 'default';
  }

  const delta = pressure - previousPressure;

  if (pressure > HIGH_PRESSURE_HPA && Math.abs(delta) <= STABLE_DELTA_HPA) {
    return 'sunny';
  }

  if (pressure < LOW_PRESSURE_HPA && Math.abs(delta) <= STABLE_DELTA_HPA) {
    return 'humid';
  }

  if (delta <= SHARP_DROP_HPA) {
    return 'storm';
  }

  if (delta <= MODERATE_DROP_HPA) {
    return 'rain';
  }

  return 'default';
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const getDaysInMonth = (monthKey: string) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return 31;
  }

  return new Date(year, month, 0).getDate();
};

const shiftMonthKey = (monthKey: string, offset: number) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthKeyForToday();
  }

  const shifted = new Date(year, month - 1 + offset, 1);
  return `${shifted.getFullYear()}-${pad2(shifted.getMonth() + 1)}`;
};

const buildDateForMonth = (monthKey: string, day: number) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return todayIso();
  }

  const safeDay = Math.max(1, Math.min(day, getDaysInMonth(monthKey)));
  return `${year}-${pad2(month)}-${pad2(safeDay)}`;
};

const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

const monthKeyForToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
};

const formatMonthLabel = (monthKey: string) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const monthIndex = Number(monthRaw) - 1;
  return `${MONTH_NAMES[monthIndex] ?? monthRaw} ${yearRaw}`;
};

const formatLongDate = (isoDate: string) => {
  const [yearRaw, monthRaw, dayRaw] = isoDate.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return isoDate;
  }
  return `${day} de ${MONTH_NAMES[month - 1] ?? monthRaw} de ${year}`;
};

const buildMonthGrid = (monthKey: string) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return [] as Array<{ date: string; day: number }>;
  }

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ date: string; day: number } | null> = [];
  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      date: `${year}-${pad2(month)}-${pad2(day)}`,
    });
  }

  return cells;
};

const sortByDate = (items: WateringReminderPlant[]) =>
  [...items].sort((left, right) => {
    const leftDate = left.nextWateringDate ?? '9999-12-31';
    const rightDate = right.nextWateringDate ?? '9999-12-31';
    return leftDate.localeCompare(rightDate) || left.name.localeCompare(right.name);
  });

const deriveReminderPlant = (plant: Record<string, unknown>): WateringReminderPlant | null => {
  const id = typeof plant.id === 'string' ? plant.id : '';
  const name = typeof plant.name === 'string' ? plant.name : '';
  if (!id || !name) return null;

  const wateringIntervalDays =
    typeof plant.wateringIntervalDays === 'number'
      ? plant.wateringIntervalDays
      : typeof plant.wateringIntervalDays === 'string'
        ? Number(plant.wateringIntervalDays)
        : null;

  const nextWateringDate =
    typeof plant.nextWateringDate === 'string'
      ? plant.nextWateringDate
      : typeof plant.lastWatered === 'string' && Number.isFinite(wateringIntervalDays ?? NaN)
        ? (() => {
            const wateredOn = new Date(plant.lastWatered as string);
            if (Number.isNaN(wateredOn.getTime())) return null;
            wateredOn.setUTCDate(wateredOn.getUTCDate() + Number(wateringIntervalDays));
            return wateredOn.toISOString().slice(0, 10);
          })()
        : null;

  return {
    id,
    name,
    imageUrl: typeof plant.imageUrl === 'string' ? plant.imageUrl : null,
    categoryName: typeof plant.categoryName === 'string' ? plant.categoryName : null,
    lastWatered: typeof plant.lastWatered === 'string' ? plant.lastWatered : null,
    wateringIntervalDays: Number.isFinite(wateringIntervalDays ?? NaN) ? Number(wateringIntervalDays) : null,
    nextWateringDate,
    isOverdue: Boolean(nextWateringDate && nextWateringDate <= todayIso()),
  };
};

const buildFallbackCalendar = (plants: Array<Record<string, unknown>>, monthKey: string) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const monthStart = `${monthKey}-01`;
  const monthEndDay = new Date(year, month, 0).getDate();
  const monthEnd = `${monthKey}-${pad2(monthEndDay)}`;

  const reminders = plants.map(deriveReminderPlant).filter((item): item is WateringReminderPlant => Boolean(item));
  const daysMap = new Map<string, WateringReminderPlant[]>();
  const pendingPlants: WateringReminderPlant[] = [];

  reminders.forEach((plant) => {
    const dueDate = plant.nextWateringDate;
    if (!dueDate) return;

    if (dueDate >= monthStart && dueDate <= monthEnd) {
      const current = daysMap.get(dueDate) ?? [];
      current.push(plant);
      daysMap.set(dueDate, current);
    }

    if (dueDate <= todayIso()) {
      pendingPlants.push(plant);
    }
  });

  return {
    month: monthKey,
    days: Array.from(daysMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, plantsForDay]) => ({ date, plants: sortByDate(plantsForDay) })),
    pendingPlants: sortByDate(pendingPlants),
  };
};

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);
  const previousPressureRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [plantsData, setPlantsData] = useState<Array<Record<string, unknown>>>([]);
  const [calendarMonthKey, setCalendarMonthKey] = useState(monthKeyForToday());
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [weatherState, setWeatherState] = useState<WeatherState>('default');
  const [updatingPlantId, setUpdatingPlantId] = useState<string | null>(null);

  const calendar = useMemo(() => buildFallbackCalendar(plantsData, calendarMonthKey), [plantsData, calendarMonthKey]);

  const calendarByDate = useMemo(() => {
    const mapping = new Map<string, WateringReminderPlant[]>();
    calendar.days.forEach((day) => {
      mapping.set(day.date, sortByDate(day.plants));
    });
    return mapping;
  }, [calendar]);

  const selectedDayPlants = useMemo(() => calendarByDate.get(selectedDate) ?? [], [calendarByDate, selectedDate]);
  const pendingPlants = useMemo(() => sortByDate(calendar.pendingPlants ?? []), [calendar.pendingPlants]);
  const monthGrid = useMemo(() => buildMonthGrid(calendarMonthKey), [calendarMonthKey]);
  const monthLabel = useMemo(() => formatMonthLabel(calendarMonthKey), [calendarMonthKey]);
  const weatherUi = useMemo(() => {
    const paletteByState: Record<WeatherState, { backgroundColor: string; borderColor: string; iconBackgroundColor: string; iconColor: string }> = {
      default: {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        iconBackgroundColor: hexToRgba(theme.colors.muted, 0.9),
        iconColor: theme.colors.mutedForeground,
      },
      sunny: {
        backgroundColor: hexToRgba(theme.colors.accent, 0.95),
        borderColor: hexToRgba(theme.colors.primary, 0.14),
        iconBackgroundColor: hexToRgba(theme.colors.primary, 0.14),
        iconColor: theme.colors.primary,
      },
      rain: {
        backgroundColor: hexToRgba(theme.colors.secondary, 0.72),
        borderColor: hexToRgba(theme.colors.tertiary, 0.14),
        iconBackgroundColor: hexToRgba(theme.colors.tertiary, 0.15),
        iconColor: theme.colors.tertiary,
      },
      storm: {
        backgroundColor: hexToRgba(theme.colors.warning, 0.18),
        borderColor: hexToRgba(theme.colors.destructive, 0.18),
        iconBackgroundColor: hexToRgba(theme.colors.destructive, 0.18),
        iconColor: theme.colors.destructive,
      },
      humid: {
        backgroundColor: hexToRgba(theme.colors.accent, 0.75),
        borderColor: hexToRgba(theme.colors.primary, 0.12),
        iconBackgroundColor: hexToRgba(theme.colors.primary, 0.12),
        iconColor: theme.colors.primary,
      },
    };

    return {
      message: WEATHER_MESSAGES[weatherState],
      iconName: WEATHER_ICONS[weatherState],
      ...paletteByState[weatherState],
    };
  }, [theme, weatherState]);

  const displayName = useMemo(() => {
    const fromAuth = currentUser?.displayName?.trim();
    if (fromAuth) return fromAuth;
    const emailPrefix = currentUser?.email?.split('@')?.[0]?.trim();
    return emailPrefix || 'Usuario';
  }, [currentUser]);

  const loadSummary = useCallback(async (showLoading = true) => {
    if (!currentUser) return;
    if (showLoading) setIsLoading(true);
    setSummaryError(null);

    try {
      const profile = await getUserProfile(currentUser.uid);
      setPlantsData(profile.plants as Array<Record<string, unknown>>);
    } catch (error) {
      console.warn('Error al cargar resumen:', error);
      setPlantsData([]);
      setSummaryError('No pudimos cargar tus plantas. Mostrando un calendario vacío por ahora.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleWaterPlant = useCallback(async (plantId: string) => {
    if (updatingPlantId) return;
    setUpdatingPlantId(plantId);
    try {
      await updatePlant(plantId, { lastWatered: todayIso() });
      await loadSummary(false);
    } catch (error) {
      console.warn('Error al registrar riego:', error);
    } finally {
      setUpdatingPlantId(null);
    }
  }, [updatingPlantId, loadSummary]);

  const changeMonth = useCallback((offset: number) => {
    setCalendarMonthKey((previousMonthKey) => {
      const nextMonthKey = shiftMonthKey(previousMonthKey, offset);
      const currentDay = Number(selectedDate.split('-')[2]);
      const nextSelectedDate = buildDateForMonth(nextMonthKey, Number.isFinite(currentDay) ? currentDay : 1);
      setSelectedDate(nextSelectedDate);
      return nextMonthKey;
    });
  }, [selectedDate]);

  const goToPreviousMonth = useCallback(() => changeMonth(-1), [changeMonth]);
  const goToNextMonth = useCallback(() => changeMonth(1), [changeMonth]);

  useFocusEffect(
    useCallback(() => {
      loadSummary(true);
    }, [loadSummary])
  );

  useEffect(() => {
    let isActive = true;
    let subscription: { remove: () => void } | null = null;

    const startBarometer = async () => {
      try {
        const isAvailable = await Barometer.isAvailableAsync();

        if (!isActive || !isAvailable) {
          return;
        }

        Barometer.setUpdateInterval(2500);
        subscription = Barometer.addListener(({ pressure }) => {
          if (!isActive) {
            return;
          }

          const nextState = getWeatherState(pressure, previousPressureRef.current);
          previousPressureRef.current = pressure;
          setWeatherState(nextState);
        });
      } catch (error) {
        if (__DEV__) {
          console.warn('No se pudo iniciar el barómetro:', error);
        }
      }
    };

    startBarometer();

    return () => {
      isActive = false;
      previousPressureRef.current = null;
      subscription?.remove();
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => loadSummary(true)}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.greetingLine}>Hola, {displayName}</Text>
            <Text style={styles.headerMessage}>Cada planta tiene su tiempo de florecer.</Text>
          </View>
          <Image
            source={require('../../../assets/images/hojas.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      <View
        style={[
          styles.weatherBanner,
          {
            backgroundColor: weatherUi.backgroundColor,
            borderColor: weatherUi.borderColor,
          },
        ]}
      >
        <View style={[styles.weatherIconWrap, { backgroundColor: weatherUi.iconBackgroundColor }]}>
          <Feather name={weatherUi.iconName} size={16} color={weatherUi.iconColor} />
        </View>
        <Text style={styles.weatherMessage}>{weatherUi.message}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity style={styles.monthNavButton} onPress={goToPreviousMonth} activeOpacity={0.85}>
            <Feather name="chevron-left" size={18} color={theme.colors.foreground} />
          </TouchableOpacity>

          <View style={styles.monthHeaderContent}>
            <Text style={styles.monthLabel}>{monthLabel.toUpperCase()}</Text>
            <Text style={styles.sectionSubtitle}>Tocá un día para ver qué plantas necesitan riego.</Text>
          </View>

          <TouchableOpacity style={styles.monthNavButton} onPress={goToNextMonth} activeOpacity={0.85}>
            <Feather name="chevron-right" size={18} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>

        {summaryError ? (
          <View style={styles.summaryNotice}>
            <Feather name="alert-circle" size={16} color={theme.colors.destructive} />
            <Text style={styles.summaryNoticeText}>{summaryError}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.calendarCard}>
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekDayLabel}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {monthGrid.map((cell, index) => {
                if (!cell) {
                  return <View key={`blank-${index}`} style={styles.calendarCellBlank} />;
                }

                const plants = calendarByDate.get(cell.date) ?? [];
                const isSelected = selectedDate === cell.date;
                const hasWatering = plants.length > 0;
                const isToday = cell.date === todayIso();

                return (
                  <TouchableOpacity
                    key={cell.date}
                    style={[
                      styles.calendarCell,
                      isSelected && styles.calendarCellSelected,
                      isToday && !isSelected ? styles.calendarCellToday : null,
                    ]}
                    onPress={() => setSelectedDate(cell.date)}
                    activeOpacity={0.85}
                  >
                    <View style={isSelected ? styles.calendarDayCircleSelected : styles.calendarDayCircle}>
                      <Text style={[styles.calendarDayNumber, isSelected && styles.calendarDayNumberSelected]}>
                        {cell.day}
                      </Text>
                    </View>
                    {hasWatering ? (
                      <View style={styles.calendarDotWrap}>
                        <Text style={styles.calendarDotEmoji}>💧</Text>
                      </View>
                    ) : (
                      <View style={styles.calendarDotPlaceholder} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Riegos del día</Text>
            <Text style={styles.sectionSubtitle}>{formatLongDate(selectedDate)}</Text>
          </View>
        </View>

        {selectedDayPlants.length > 0 ? (
          <View style={styles.listStack}>
            {selectedDayPlants.map((plant) => (
              <View key={plant.id} style={styles.reminderCard}>
                <View style={styles.reminderIconWrap}>
                  <MaterialCommunityIcons name="leaf" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>{plant.name}</Text>
                  <View style={styles.reminderMetaRow}>
                    <Text style={styles.reminderSubtitle}>{plant.categoryName || 'Sin categoría'}</Text>
                    {plant.wateringIntervalDays ? (
                      <View style={styles.reminderWaterRow}>
                        <Feather name="droplet" size={13} color={theme.colors.tertiary} />
                        <Text style={styles.reminderWaterText}>
                          {plant.wateringIntervalDays === 1
                            ? 'cada 1 día'
                            : `cada ${plant.wateringIntervalDays} días`}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {plant.nextWateringDate ? (
                    <Text style={styles.reminderMeta}>Siguiente riego: {formatLongDate(plant.nextWateringDate)}</Text>
                  ) : null}
                </View>
                {selectedDate === todayIso() ? (
                  <TouchableOpacity
                    style={[
                      styles.waterCheckButton,
                      updatingPlantId === plant.id && styles.waterCheckButtonActive,
                    ]}
                    onPress={() => handleWaterPlant(plant.id)}
                    disabled={updatingPlantId !== null}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Marcar ${plant.name} como regada`}
                  >
                    {updatingPlantId === plant.id ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Feather name="check" size={18} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay riegos programados para este día.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Pendientes de riego</Text>
            <Text style={styles.sectionSubtitle}>Plantas que ya necesitan agua.</Text>
          </View>
        </View>

        {pendingPlants.length > 0 ? (
          <View style={styles.listStack}>
            {pendingPlants.map((plant) => (
              <View key={plant.id} style={styles.pendingCard}>
                <View style={styles.pendingContent}>
                  <View style={styles.pendingHeader}>
                    <Text style={styles.reminderTitle}>{plant.name}</Text>
                    {plant.isOverdue ? <Text style={styles.overdueChip}>Atrasada</Text> : null}
                  </View>
                  <Text style={styles.reminderSubtitle}>{plant.categoryName || 'Sin categoría'}</Text>
                  <Text style={styles.reminderMeta}>
                    {plant.nextWateringDate
                      ? `Debía regarse: ${formatLongDate(plant.nextWateringDate)}`
                      : 'Sin próxima fecha de riego'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.waterCheckButton,
                    updatingPlantId === plant.id && styles.waterCheckButtonActive,
                  ]}
                  onPress={() => handleWaterPlant(plant.id)}
                  disabled={updatingPlantId !== null}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Marcar ${plant.name} como regada`}
                >
                  {updatingPlantId === plant.id ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Feather name="check" size={18} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tienes plantas pendientes de riego por ahora.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}