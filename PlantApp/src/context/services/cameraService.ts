//cameraService
import { CameraView, CameraType, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { RefObject } from 'react';

export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface CaptureOptions {
  quality?: number;      // 0 a 1
  base64?: boolean;
  skipProcessing?: boolean;
}

const CameraService = {
 
  async takePhoto(
    cameraRef: RefObject<CameraView>,
    options: CaptureOptions = {}
  ): Promise<PhotoResult> {
    if (!cameraRef.current) {
      throw new Error('La cámara no está disponible');
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: options.quality ?? 0.8,
      base64: options.base64 ?? false,
      skipProcessing: options.skipProcessing ?? false,
    });

    if (!photo) throw new Error('No se pudo capturar la foto');

    return {
      uri: photo.uri,
      width: photo.width,
      height: photo.height,
      base64: photo.base64,
    };
  },


  async saveToGallery(uri: string): Promise<MediaLibrary.Asset> {
    const asset = await MediaLibrary.createAssetAsync(uri);
    return asset;
  },

  toggleFacing(current: CameraType): CameraType {
    return current === 'back' ? 'front' : 'back';
  },

  cycleFlashMode(current: FlashMode): FlashMode {
    const modes: FlashMode[] = ['off', 'on', 'auto'];
    const index = modes.indexOf(current);
    return modes[(index + 1) % modes.length];
  },
};

export default CameraService;