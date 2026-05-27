import React from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';
import { useAuth } from '../../context/AuthContext';
import { usePlants } from '../../context/PlantContext';
import { CreatePlantPayload, IdentifyResult, uploadPlantPhoto } from '../../context/services/api';
import { getPlantWateringInfo, PlantWateringInfo } from '../../context/services/geminiService';

export default function ScanResultScreen({ navigation, route }: any) {
    const { theme } = useTheme();
    const { currentUser } = useAuth();
    const { addPlant } = usePlants();
    const result: IdentifyResult | undefined = route?.params?.result;
    const imageUri: string | undefined = route?.params?.imageUri;
    const imageBase64: string | undefined = route?.params?.imageBase64;
    const [isSaving, setIsSaving] = React.useState(false);
    const [wateringInfo, setWateringInfo] = React.useState<PlantWateringInfo>({
        wateringFrequencyDays: result?.wateringFrequencyDays ?? null,
        wateringNotes: result?.wateringNotes ?? null,
    });
    const [wateringFrequencyDays, setWateringFrequencyDays] = React.useState(
        typeof result?.wateringFrequencyDays === 'number' ? String(result.wateringFrequencyDays) : '',
    );
    const [wateringNotes, setWateringNotes] = React.useState(result?.wateringNotes ?? '');
    const hasManualWateringEditRef = React.useRef(false);

    React.useEffect(() => {
        let isMounted = true;
        const scientificName = result?.scientific_name?.trim();

        if (!scientificName) {
            console.log('[ScanResult] no scientific_name, using watering info from route params:', {
                wateringFrequencyDays: result?.wateringFrequencyDays ?? null,
                wateringNotes: result?.wateringNotes ?? null,
            });
            setWateringInfo({
                wateringFrequencyDays: result?.wateringFrequencyDays ?? null,
                wateringNotes: result?.wateringNotes ?? null,
            });
            return () => {
                isMounted = false;
            };
        }

        console.log('[ScanResult] about to call Gemini for watering info:', scientificName);
        void getPlantWateringInfo(scientificName)
            .then((info) => {
                console.log('[ScanResult] Gemini watering info received:', info);
                if (isMounted) {
                    setWateringInfo(info);
                    if (!hasManualWateringEditRef.current) {
                        setWateringFrequencyDays(
                            typeof info.wateringFrequencyDays === 'number' ? String(info.wateringFrequencyDays) : '',
                        );
                        setWateringNotes(info.wateringNotes ?? '');
                    }
                }
            })
            .catch((error) => {
                console.warn('[ScanResult] Gemini call failed, keeping route params watering info:', error);
                if (isMounted) {
                    setWateringInfo({
                        wateringFrequencyDays: result?.wateringFrequencyDays ?? null,
                        wateringNotes: result?.wateringNotes ?? null,
                    });
                }
            });

        return () => {
            isMounted = false;
        };
    }, [result?.scientific_name]);

    const goToPlantCare = () => {
        hasManualWateringEditRef.current = false;
        setWateringInfo({ wateringFrequencyDays: null, wateringNotes: null });
        setWateringFrequencyDays('');
        setWateringNotes('');
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'PlantCare' } }],
        });
    };

    const goToHome = () => {
        hasManualWateringEditRef.current = false;
        setWateringInfo({ wateringFrequencyDays: null, wateringNotes: null });
        setWateringFrequencyDays('');
        setWateringNotes('');
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Home' } }],
        });
    };

    const handleWateringFrequencyChange = (text: string) => {
        hasManualWateringEditRef.current = true;
        setWateringFrequencyDays(text);
    };

    const handleWateringNotesChange = (text: string) => {
        hasManualWateringEditRef.current = true;
        setWateringNotes(text);
    };

    const parseWateringFrequencyDays = (rawValue: string): number | null => {
        const trimmed = rawValue.trim();
        if (!trimmed) return null;
        if (!/^\d+$/.test(trimmed)) return null;

        const parsed = Number(trimmed);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    };

    if (!result) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.emptyText, { color: theme.colors.foreground }]}>No se encontró un resultado para mostrar.</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleSave = async () => {
        if (!currentUser) return;

        setIsSaving(true);
        try {
            let plantImageUrl: string | undefined = imageUri;

            if (imageBase64) {
                try {
                    plantImageUrl = await uploadPlantPhoto(
                        currentUser.uid,
                        `${result.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.jpg`,
                        imageBase64,
                    );
                } catch (photoError) {
                    console.warn('No se pudo subir la foto de la planta, guardamos la planta sin Storage:', photoError);
                    plantImageUrl = imageUri || undefined;
                }
            }

            const newPlant: CreatePlantPayload = {
                name: result.name,
                categoryId: 'cat-general',
                age: result.age || '0',
                price: 0,
                growthTime: result.growthTime || 'N/A',
                height: result.height || 'N/A',
                isFavorite: false,
                toxic: result.toxic,
                toxicTo: result.toxicTo,
                flowering: result.flowering,
                status: result.status,
                lightPreference: result.lightPreference,
                originLocality: result.originLocality,
                temperature: result.temperature,
                fertilizerType: result.fertilizerType,
                description: result.description,
                wateringFrequencyDays:
                    parseWateringFrequencyDays(wateringFrequencyDays) ?? wateringInfo.wateringFrequencyDays,
                wateringNotes: wateringNotes.trim() ? wateringNotes.trim() : wateringInfo.wateringNotes,
                lastWatered: new Date().toISOString(),
                lastFertilized: new Date().toISOString(),
                imageUrl: plantImageUrl || 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1000&auto=format&fit=crop',
                image: plantImageUrl,
                userId: currentUser.uid,
                careTypes: [],
                pests: [],
            };

            await addPlant(newPlant);
            Alert.alert('¡Éxito!', `${result.name} ha sido añadida a tu jardín.`, [
                { text: 'Ir al inicio', onPress: goToHome },
                { text: 'Ir al jardín', onPress: goToPlantCare },
            ]);
        } catch (error) {
            console.error('Error guardando planta:', error);
            Alert.alert('Error', 'No pudimos guardar la planta en tu jardín.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.foreground }]}>Resultado</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.resultCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.heroImageWrap, { backgroundColor: theme.colors.muted }]}>
                        {imageUri || imageBase64 ? (
                            <Image
                                source={imageUri ? { uri: imageUri } : { uri: `data:image/jpeg;base64,${imageBase64}` }}
                                style={styles.resultImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <MaterialCommunityIcons name="image-off-outline" size={28} color={theme.colors.mutedForeground} />
                                <Text style={[styles.imagePlaceholderText, { color: theme.colors.mutedForeground }]}>Sin imagen disponible</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.resultBody}>
                        <Text style={[styles.plantName, { color: theme.colors.primary }]}>{result.name}</Text>
                        {result.scientific_name && (
                            <Text style={[styles.scientificName, { color: theme.colors.mutedForeground }]}>{result.scientific_name}</Text>
                        )}
                        <Text style={[styles.plantCategory, { color: theme.colors.mutedForeground }]}>{result.category}</Text>

                        <View style={styles.statusBadge}>
                            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                            <Text style={styles.statusText}>{result.status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.detailsGrid}>
                    <DetailItem icon="calendar-clock" label="Edad" value={result.age} />
                    <DetailItem icon="arrow-up-bold" label="Altura" value={result.height} />
                    <DetailItem icon="sun-wireless" label="Luz" value={result.lightPreference} />
                    <DetailItem icon="thermometer" label="Temperatura" value={result.temperature} />
                </View>

                <View style={[styles.infoSection, { backgroundColor: theme.colors.muted }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Información</Text>
                    <InfoRow label="Floración" value={result.flowering} />
                    <InfoRow label="Toxicidad" value={result.toxic ? 'Tóxica' : 'Segura'} />
                    <InfoRow label="Fertilizante" value={result.fertilizerType} />
                </View>

                <View style={[styles.wateringSection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Riego</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.colors.mutedForeground }]}>Cada cuántos días regar</Text>
                        <TextInput
                            style={[styles.textInput, { color: theme.colors.foreground, borderColor: theme.colors.border }]}
                            value={wateringFrequencyDays}
                            onChangeText={handleWateringFrequencyChange}
                            keyboardType="number-pad"
                            placeholder="Ej. 7"
                            placeholderTextColor={theme.colors.mutedForeground}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.colors.mutedForeground }]}>Notas de riego</Text>
                        <TextInput
                            style={[styles.textArea, { color: theme.colors.foreground, borderColor: theme.colors.border }]}
                            value={wateringNotes}
                            onChangeText={handleWateringNotesChange}
                            multiline
                            placeholder="Ej. Regar menos en invierno"
                            placeholderTextColor={theme.colors.mutedForeground}
                        />
                    </View>
                </View>

                {result.description && (
                    <View style={styles.descriptionSection}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Descripción</Text>
                        <Text style={[styles.descriptionText, { color: theme.colors.foreground }]}>{result.description}</Text>
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.addButtonText}>Añadir a mi jardín</Text>}
            </TouchableOpacity>
        </View>
    );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    const { theme } = useTheme();
    return (
        <View style={[styles.detailBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name={icon as any} size={20} color={theme.colors.primary} />
            <Text style={[styles.detailLabel, { color: theme.colors.mutedForeground }]}>{label}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.foreground }]}>{value}</Text>
        </View>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    const { theme } = useTheme();
    return (
        <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.mutedForeground }]}>{label}:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.foreground }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
    iconButton: { padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
    content: { padding: 20, paddingBottom: 120 },
    resultCard: { marginBottom: 16, borderRadius: 28, overflow: 'hidden', borderWidth: 1, elevation: 4 },
    heroImageWrap: { minHeight: 240, alignItems: 'center', justifyContent: 'center', padding: 14 },
    resultImage: { width: '100%', height: 240 },
    imagePlaceholder: { width: '100%', minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 },
    imagePlaceholderText: { fontSize: 14, fontWeight: '600' },
    resultBody: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
    plantName: { fontSize: 28, fontWeight: 'bold' },
    scientificName: { fontSize: 16, fontStyle: 'italic', marginTop: 2 },
    plantCategory: { fontSize: 16, marginTop: 5 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15 },
    statusText: { color: '#4CAF50', fontSize: 12, fontWeight: '700', marginLeft: 6 },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    detailBox: { width: '48%', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, alignItems: 'center' },
    detailLabel: { fontSize: 12, marginTop: 5 },
    detailValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    infoSection: { padding: 20, borderRadius: 20, marginBottom: 20 },
    wateringSection: { padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    infoLabel: { fontSize: 14 },
    infoValue: { fontSize: 14, fontWeight: '500' },
    fieldGroup: { marginBottom: 14 },
    fieldLabel: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
    textInput: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        backgroundColor: 'transparent',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 96,
        textAlignVertical: 'top',
        backgroundColor: 'transparent',
    },
    descriptionSection: { paddingHorizontal: 5, marginBottom: 20 },
    descriptionText: { fontSize: 15, lineHeight: 22 },
    addButton: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    addButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    emptyText: { fontSize: 16, textAlign: 'center', padding: 20 },
    backButton: { marginHorizontal: 20, marginTop: 10, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    backButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});