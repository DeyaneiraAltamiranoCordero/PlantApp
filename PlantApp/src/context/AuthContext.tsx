import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, useContext, useEffect, useState } from 'react';

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

  const syncUserToFirestore = async (user: FirebaseAuthTypes.User) => {
    try {
      const userRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        await userRef.set({
          id: user.uid,
          name: user.displayName?.split(' ')[0] || 'Usuario',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          nickname: `plantLover_${user.uid.substring(0, 4)}`,
          email: user.email || '',
          profilePicture: user.photoURL || '',
          plantCount: 0,
          streak: 0,
          registrationDate: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error al sincronizar usuario:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      try {
        if (user) {
          await syncUserToFirestore(user);
          setCurrentUser(user);
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