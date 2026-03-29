import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

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
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
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
  }, []);

  const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const signInResult = await GoogleSignin.signIn();
    console.log('SignIn result:', JSON.stringify(signInResult));
    const idToken = signInResult.data?.idToken;
    console.log('idToken:', idToken ? 'obtenido' : 'NULL');
    if (!idToken) throw new Error('No se obtuvo el token de Google');
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(googleCredential);
    console.log('Firebase user:', result.user.uid);
  } catch (error) {
    console.error('Error en Google Sign-In:', error);
    throw error;
  }
};

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}