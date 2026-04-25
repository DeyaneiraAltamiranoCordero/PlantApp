import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';
import { Button } from '../ui/Button';
import { useCamera } from '../../hooks/useCamera';

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

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.colors.background,
        },
        camera: {
            flex: 1,
        },
        permissionContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background,
        },
        permissionText: {
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
            fontSize: theme.typography.size.lg,
            fontFamily: theme.typography.fontFamily.default,
            color: theme.colors.foreground,
        },
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        scanFrame: {
            width: 250,
            height: 250,
            borderWidth: 2,
            borderColor: theme.colors.primary,
            backgroundColor: 'transparent',
            borderRadius: theme.spacing.lg,
        },
        controls: {
            position: 'absolute',
            bottom: theme.spacing.huge * 2,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        flipButton: {
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: theme.spacing.md,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        captureButton: {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: 'rgba(255,255,255,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: theme.spacing.xl,
        },
        captureInner: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'white',
        },
        titleContainer: {
            position: 'absolute',
            top: Platform.OS === 'ios' ? 60 : 40,
            left: 0,
            right: 0,
            alignItems: 'center',
        },
        closeButton: {
            position: 'absolute',
            top: Platform.OS === 'ios' ? 52 : 32,
            left: theme.spacing.lg,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
            zIndex: 20,
        },
        flashButton: {
            position: 'absolute',
            top: Platform.OS === 'ios' ? 52 : 32,
            right: theme.spacing.lg,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
            zIndex: 20,
        },
        titleText: {
            color: 'white',
            fontSize: theme.typography.size.lg,
            fontWeight: theme.typography.weight.bold as 'bold',
            fontFamily: theme.typography.fontFamily.bold,
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
        }
    });

    if (!permissions || !isPermissionGranted) {
        return <View style={styles.container} />;
    }

    const handleCapture = async () => {
        // Necesitamos base64: true para enviar la imagen real al servidor de IA
        const photo = await takePhoto({ quality: 0.7, base64: true });
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
                    accessibilityLabel="Volver"
                >
                    <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
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
                    {/* Espaciador para mantener simetría */}
                    <View style={{ width: 44, height: 44, marginHorizontal: theme.spacing.md }} />

                    {/* Botón central para capturar foto real */}
                    <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
                        <MaterialCommunityIcons name="camera-flip-outline" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}
