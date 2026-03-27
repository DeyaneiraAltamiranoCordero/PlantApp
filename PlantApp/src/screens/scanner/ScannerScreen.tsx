import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CameraScanner } from '../../components/camera/CameraScanner';

export default function ScannerScreen() {
    const handleScan = (data: any) => {
        // En el futuro, aquí conectaremos la lógica de la Inteligencia Artificial
        console.log("Datos de la cámara recibidos para IA:", data);
        Alert.alert(
            "Análisis IA (Próximamente)",
            "Has capturado la planta. La integración con la Inteligencia Artificial estará disponible muy pronto."
        );
    };

    return (
        <View style={styles.container}>
            <CameraScanner onScan={handleScan} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
