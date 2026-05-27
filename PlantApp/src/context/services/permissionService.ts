//permissionService.ts
import { Camera } from 'expo-camera';
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
    // First check current permission to avoid re-prompting unnecessarily
    const current = await (Camera as any).getCameraPermissionsAsync();
    const currentStatus = normalizeStatus(current.granted, current.status);
    if (currentStatus !== 'undetermined') return currentStatus;

    const { granted, status } = await (Camera as any).requestCameraPermissionsAsync();
    return normalizeStatus(granted, status);
  },


  async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    // Check current media library permission first
    const current = await MediaLibrary.getPermissionsAsync();
    const currentStatus = normalizeStatus(current.granted, current.status);
    if (currentStatus !== 'undetermined') return currentStatus;

    const { granted, status } = await MediaLibrary.requestPermissionsAsync();
    return normalizeStatus(granted, status);
  },


  async checkAllPermissions(): Promise<AppPermissions> {
    const [camera, mediaLibrary] = await Promise.all([
      (Camera as any).getCameraPermissionsAsync(),
      MediaLibrary.getPermissionsAsync(),
    ]);

    return {
      camera: normalizeStatus(camera.granted, camera.status),
      mediaLibrary: normalizeStatus(mediaLibrary.granted, mediaLibrary.status),
    };
  },


  async requestAllPermissions(): Promise<AppPermissions> {
    // Check current permissions and request only those that are undetermined
    const current = await PermissionService.checkAllPermissions();
    const results: AppPermissions = { ...current };

    if (current.camera === 'undetermined') {
      results.camera = await PermissionService.requestCameraPermission();
    }

    if (current.mediaLibrary === 'undetermined') {
      results.mediaLibrary = await PermissionService.requestMediaLibraryPermission();
    }

    return results;
  },

  isGranted: (status: PermissionStatus): boolean => status === 'granted',
};

export default PermissionService;