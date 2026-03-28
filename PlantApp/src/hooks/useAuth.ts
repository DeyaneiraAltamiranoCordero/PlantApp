import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '671777128731-ng6r50hcbatkbi5objkpchphs92v6ml6.apps.googleusercontent.com', // Android Client ID
        redirectUrl: AuthSession.getRedirectUrl(),
    });

    const syncUserToFirestore = async (user: User) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    id: user.uid,
                    name: user.displayName?.split(' ')[0] || 'Usuario',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    nickname: `plantLover_${user.uid.substring(0, 4)}`,
                    email: user.email || '',
                    profilePicture: user.photoURL || '',
                    plantCount: 0,
                    streak: 0,
                    registrationDate: new Date().toISOString()
                }, { merge: true });
                console.log('Usuario sincronizado con Firestore:', user.uid);
            } else {
                console.log('Usuario ya existe en Firestore:', user.uid);
            }
        } catch (error) {
            console.error('Error al sincronizar usuario con Firestore:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    console.log('Usuario autenticado:', user.uid);
                    await syncUserToFirestore(user);
                    setCurrentUser(user);
                } else {
                    setCurrentUser(null);
                }
                setLoading(false);
            } catch (e) {
                console.error('Error al inicializar autenticación con Firebase:', e);
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Procesar respuesta de Google Auth
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            signInWithFirebase(id_token);
        }
    }, [response]);

    const signInWithFirebase = async (idToken: string) => {
        try {
            console.log('Iniciando sesión con Firebase usando token de Google...');
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            console.log('Sesión iniciada con Google:', userCredential.user.uid);
            await syncUserToFirestore(userCredential.user);
            setCurrentUser(userCredential.user);
        } catch (error: any) {
            console.error('Error al iniciar sesión con Firebase:', error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            console.log('Abriendo Google Sign-In...');
            await promptAsync();
        } catch (error: any) {
            console.error('Error al abrir Google Sign-In:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            console.log('Cerrando sesión...');
            await firebaseSignOut(auth);
            setCurrentUser(null);
        } catch (e) {
            console.error('Error al cerrar sesión:', e);
        }
    };

    return { currentUser, loading, signInWithGoogle, signOut };
}