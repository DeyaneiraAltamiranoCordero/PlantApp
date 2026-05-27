import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { CameraScanner } from '../../components/camera/CameraScanner';
import { identifyPlant } from '../../context/services/api';
import { getPlantWateringInfo } from '../../context/services/geminiService';
import { useTheme } from '../../theme/desingSystem';

export default function ScannerScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleScan = async (data: any) => {
        setIsAnalyzing(true);
        try {
            console.log("Iniciando análisis con IA...");
            const imageData = data.base64 || data.uri;
            const analysis = await identifyPlant(imageData);
            const wateringInfo = analysis.scientific_name
                ? await getPlantWateringInfo(analysis.scientific_name)
                : { wateringFrequencyDays: null, wateringNotes: null };
            const mergedAnalysis = {
                ...analysis,
                ...wateringInfo,
            };
            console.log("Planta identificada:", analysis.name);
            navigation.navigate('ScanResult' as never, { result: mergedAnalysis, imageUri: data.uri, imageBase64: data.base64 } as never);
        } catch (error: any) {
            console.error("Error completo en el análisis:", error);
            let errorMessage = "No pudimos conectar con la IA.";
            if (error.status) {
                errorMessage = `Error del servidor (${error.status})`;
            }
            if (error.body && (error.body as any).description) {
                errorMessage = (error.body as any).description;
            }

            Alert.alert("Error de Análisis", errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <View style={styles.container}>
            <CameraScanner
                mode="plant-analysis"
                onPhotoTaken={handleScan}
                onGallerySelected={handleScan}
                onClose={() => navigation.navigate('Home')}
            />

            {isAnalyzing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: 'white' }]}>Procesando...</Text>
                </View>
            )}
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
});