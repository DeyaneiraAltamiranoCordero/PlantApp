//permissionService.ts
import { 
  requestCameraPermissionsAsync, 
  getCameraPermissionsAsync 
} from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface AppPermissions {
  camera: PermissionStatus;
  mediaLibrary: PermissionStatus;
}

const normalizeStatus = (granted: boolean, status: string): PermissionStatus => {
  if (granted) return 'granted';
  if (status === 'undetermined') return 'undetermined';
  return 'denied';
};

const PermissionService = {

  async requestCameraPermission(): Promise<PermissionStatus> {
    const { granted, status } = await requestCameraPermissionsAsync();
    return normalizeStatus(granted, status);
  },


  async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    const { granted, status } = await MediaLibrary.requestPermissionsAsync();
    return normalizeStatus(granted, status);
  },


  async checkAllPermissions(): Promise<AppPermissions> {
    const [camera, mediaLibrary] = await Promise.all([
      getCameraPermissionsAsync(),
      MediaLibrary.getPermissionsAsync(),
    ]);

    return {
      camera: normalizeStatus(camera.granted, camera.status),
      mediaLibrary: normalizeStatus(mediaLibrary.granted, mediaLibrary.status),
    };
  },


  async requestAllPermissions(): Promise<AppPermissions> {
    const [camera, mediaLibrary] = await Promise.all([
      PermissionService.requestCameraPermission(),
      PermissionService.requestMediaLibraryPermission(),
    ]);

    return { camera, mediaLibrary };
  },

  isGranted: (status: PermissionStatus): boolean => status === 'granted',
};

export default PermissionService;