import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  signInLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const signInInProgressRef = useRef(false);
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

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Don't block initial render on API sync (backend may be offline/unreachable).
          setCurrentUser(user);
          void syncUserToApi(user).catch((error) => {
            console.error('Error sincronizando usuario con la API:', error);
          });
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [isWeb]);

  const signInWithGoogle = async () => {
    if (isWeb) {
      throw new Error('Google Sign-In con React Native Firebase no esta habilitado en Web. Usa Android/iOS o integra Firebase Web SDK para web.');
    }

    if (signInInProgressRef.current) {
      return;
    }

    signInInProgressRef.current = true;
    setSignInLoading(true);

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
    } finally {
      signInInProgressRef.current = false;
      setSignInLoading(false);
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
    <AuthContext.Provider value={{ currentUser, loading, signInLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}