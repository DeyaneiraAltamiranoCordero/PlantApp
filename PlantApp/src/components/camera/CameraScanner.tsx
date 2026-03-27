import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';
import { Button } from '../ui/Button';

interface CameraScannerProps {
    onScan?: (data: any) => void;
}

export function CameraScanner({ onScan }: CameraScannerProps) {
    const { theme, isDark } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<'back' | 'front'>('back');

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

    if (!permission) {
        // Permissions are still loading
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        // We need permission
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                    Necesitamos tu permiso para acceder a la cámara y escanear tus plantas.
                </Text>
                <Button 
                    title="Otorgar Permiso" 
                    onPress={requestPermission} 
                    variant="primary" 
                    icon="camera"
                />
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const handleMockScan = () => {
        if (onScan) {
            onScan({ type: 'mock', data: 'Planta escaneada (simulación preparada para IA)' });
        }
    };

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing={facing}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Enfoca tu planta</Text>
                </View>
                
                <View style={styles.overlay}>
                    {/* Marco visual del escáner */}
                    <View style={styles.scanFrame} />
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <MaterialCommunityIcons name="camera-flip-outline" size={28} color="white" />
                    </TouchableOpacity>

                    {/* Botón central para simular el escaneo (o tomar foto futura) */}
                    <TouchableOpacity style={styles.captureButton} onPress={handleMockScan}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                    
                    {/* Espaciador para mantener simetría */}
                    <View style={{ width: 44, height: 44, marginHorizontal: theme.spacing.md }} />
                </View>
            </CameraView>
        </View>
    );
}
