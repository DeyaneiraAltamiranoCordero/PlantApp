import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';
import { Button } from '../../components/ui/Button';
import { useCamera } from '../../hooks/useCamera';
import { createCameraScannerStyles } from './CamaraScanner.style';

interface CameraScannerProps {
    onScan?: (data: any) => void;
    onClose?: () => void;
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
    const { theme } = useTheme();
    const {
        cameraRef,
        permissions,
        isPermissionGranted,
        isLoadingPermissions,
        facing,
        flashMode,
        requestPermissions,
        takePhoto,
        toggleFacing,
        toggleFlash,
        error,
    } = useCamera();
    const styles = createCameraScannerStyles(theme);

    if (!permissions) {
        // Permissions are still loading
        return <View style={styles.container} />;
    }

    if (!isPermissionGranted) {
        // We need permission
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                    Necesitamos tu permiso para acceder a la cámara y escanear tus plantas.
                </Text>
                {error ? (
                    <Text style={[styles.permissionText, styles.permissionErrorText]}>
                        {error}
                    </Text>
                ) : null}
                <Button 
                    title="Otorgar Permiso" 
                    onPress={requestPermissions} 
                    variant="primary" 
                    icon="camera"
                    loading={isLoadingPermissions}
                />
            </View>
        );
    }

    const handleCapture = async () => {
        const photo = await takePhoto({ quality: 0.8, base64: true });
        if (photo && onScan) {
            onScan(photo);
        }
    };

    const flashIcon = flashMode === 'off' ? 'flash-off' : flashMode === 'on' ? 'flash' : 'flash-auto';

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flashMode}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar cámara"
                >
                    <MaterialCommunityIcons name="close" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.flashButton}
                    onPress={toggleFlash}
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar flash"
                >
                    <MaterialCommunityIcons name={flashIcon as any} size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Enfoca tu planta</Text>
                </View>
                
                <View style={styles.overlay}>
                    {/* Marco visual del escáner */}
                    <View style={styles.scanFrame} />
                </View>

                <View style={styles.controls}>
                    {/* Botón central para capturar foto real */}
                    <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.bottomRightButton}
                    onPress={toggleFacing}
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar cámara"
                >
                    <MaterialCommunityIcons name="camera-flip-outline" size={26} color="white" />
                </TouchableOpacity>
            </CameraView>
        </View>
    );
}
