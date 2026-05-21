import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  ApiError,
  createUserProfile,
  getUserByUid,
  updateUserProfile,
} from './services/api';

GoogleSignin.configure({
  webClientId: '671777128731-hkd03bgupqjj5sq0flk2phit94c8ql4s.apps.googleusercontent.com',
});

interface AuthContextType {
  currentUser: FirebaseAuthTypes.User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  const syncUserToApi = async (user: FirebaseAuthTypes.User) => {
    const displayName = user.displayName ?? '';
    const [firstName, ...rest] = displayName.split(' ').filter(Boolean);
    const fallbackName = firstName || 'Usuario';
    const lastName = rest.join(' ');
    const nicknameFromEmail = user.email?.split('@')[0] || `plantLover_${user.uid.substring(0, 4)}`;

    const basePayload = {
      authUid: user.uid,
      email: user.email ?? '',
      name: fallbackName,
      nickname: nicknameFromEmail,
      profilePicture: user.photoURL ?? null,
      lastName: lastName || undefined,
      publicProfile: true,
    };

    try {
      await getUserByUid(user.uid);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await createUserProfile(basePayload);
        return;
      }
      console.error('Error sincronizando usuario con la API:', error);
    }
  };

  useEffect(() => {
    if (isWeb) {
      // React Native Firebase auth is native-first; on web it can throw if no default app is initialized.
      setLoading(false);
      return;
    }

    console.log('[AuthContext] Setting up onAuthStateChanged');
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] onAuthStateChanged fired. User:', user ? user.uid : 'null');
      try {
        if (user) {
          // Don't block initial render on API sync (backend may be offline/unreachable).
          setCurrentUser(user);
          void syncUserToApi(user).catch((error) => {
            console.error('[AuthContext] Error sincronizando usuario con la API:', error);
          });
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Error in onAuthStateChanged:', err);
      } finally {
        console.log('[AuthContext] Setting loading to false');
        setLoading(false);
      }
    });
    return () => {
      console.log('[AuthContext] Unsubscribing from auth state changes');
      unsubscribe();
    };
  }, [isWeb]);

  const signInWithGoogle = async () => {
  if (isWeb) {
    throw new Error('Google Sign-In con React Native Firebase no esta habilitado en Web. Usa Android/iOS o integra Firebase Web SDK para web.');
  }

  try {
    const auth = getAuth();
    await GoogleSignin.hasPlayServices();
    const signInResult = await GoogleSignin.signIn();
    console.log('SignIn result:', JSON.stringify(signInResult));
    const idToken = signInResult.data?.idToken;
    console.log('idToken:', idToken ? 'obtenido' : 'NULL');
    if (!idToken) throw new Error('No se obtuvo el token de Google');
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, googleCredential);
    console.log('Firebase user:', result.user.uid);
  } catch (error) {
    console.error('Error en Google Sign-In:', error);
    throw error;
  }
};

  const signInWithEmail = async (email: string, password: string) => {
    if (isWeb) {
      throw new Error('El inicio de sesión con email y contraseña no está habilitado en Web con esta configuración.');
    }

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error('Error en signInWithEmail:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (isWeb) {
      throw new Error('El restablecimiento de contraseña no está habilitado en Web con esta configuración.');
    }

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (isWeb) {
      setCurrentUser(null);
      return;
    }

    try {
      const auth = getAuth();
      await GoogleSignin.signOut();
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, signInWithEmail, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}