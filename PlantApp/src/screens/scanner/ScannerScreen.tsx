import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { CameraScanner } from '../../components/camera/CameraScanner';
import { identifyPlant, IdentifyResult } from '../../context/services/api';
import { useTheme } from '../../theme/desingSystem';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ScannerScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<IdentifyResult | null>(null);

    const handleScan = async (data: any) => {
        setIsAnalyzing(true);
        setResult(null);
        
        try {
            console.log("Iniciando análisis con IA...");
            const imageData = data.base64 || data.uri;
            const analysis = await identifyPlant(imageData);
            console.log("Planta identificada:", analysis.name);
            setResult(analysis);
        } catch (error: any) {
            console.error("Error en el análisis:", error);
            
            let errorMessage = "No pudimos conectar con la IA.";
            if (error.status) {
                errorMessage = `Error del servidor (${error.status})`;
            }

            Alert.alert("Error de Análisis", errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClose = () => {
        if (result) {
            setResult(null);
        } else {
            navigation.navigate('Home');
        }
    };

    return (
        <View style={styles.container}>
            {!result && (
                <CameraScanner
                    onScan={handleScan}
                    onClose={handleClose}
                />
            )}

            {isAnalyzing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: 'white' }]}>Analizando planta...</Text>
                </View>
            )}

            {result && (
                <View style={[styles.resultContainer, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.resultHeader}>
                        <TouchableOpacity onPress={() => setResult(null)} style={styles.backButton}>
                            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.foreground} />
                        </TouchableOpacity>
                        <Text style={[styles.resultTitle, { color: theme.colors.foreground }]}>Resultado</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.resultContent}>
                        <View style={[styles.mainCard, { backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.plantName, { color: theme.colors.primary }]}>{result.name}</Text>
                            {result.scientific_name && (
                                <Text style={[styles.scientificName, { color: theme.colors.mutedForeground }]}>
                                    {result.scientific_name}
                                </Text>
                            )}
                            <Text style={[styles.plantCategory, { color: theme.colors.mutedForeground }]}>{result.category}</Text>
                            
                            <View style={styles.statusBadge}>
                                <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                                <Text style={styles.statusText}>{result.status.toUpperCase()}</Text>
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
                            <InfoRow label="Toxicidad" value={result.toxic ? "Tóxica" : "Segura"} />
                            <InfoRow label="Fertilizante" value={result.fertilizerType} />
                        </View>

                        {result.description && (
                            <View style={styles.descriptionSection}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Descripción</Text>
                                <Text style={[styles.descriptionText, { color: theme.colors.foreground }]}>{result.description}</Text>
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity 
                        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => Alert.alert("Guardar", "Función de guardado en desarrollo.")}
                    >
                        <Text style={styles.addButtonText}>Añadir a mi jardín</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

function DetailItem({ icon, label, value }: { icon: string, label: string, value: string }) {
    const { theme } = useTheme();
    return (
        <View style={[styles.detailBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name={icon as any} size={20} color={theme.colors.primary} />
            <Text style={[styles.detailLabel, { color: theme.colors.mutedForeground }]}>{label}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.foreground }]}>{value}</Text>
        </View>
    );
}

function InfoRow({ label, value }: { label: string, value: string }) {
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    loadingText: { marginTop: 15, fontSize: 16, fontWeight: '600' },
    resultContainer: { flex: 1 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
    backButton: { padding: 5 },
    resultTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
    resultContent: { padding: 20 },
    mainCard: { padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20, elevation: 4 },
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    infoLabel: { fontSize: 14 },
    infoValue: { fontSize: 14, fontWeight: '500' },
    descriptionSection: { paddingHorizontal: 5, marginBottom: 100 },
    descriptionText: { fontSize: 15, lineHeight: 22 },
    addButton: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    addButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});