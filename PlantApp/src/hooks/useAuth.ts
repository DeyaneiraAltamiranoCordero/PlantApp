import { useState, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Configuración inicial de Google Sign-in
        GoogleSignin.configure({
            webClientId: '671777128731-hkd03bgupqjj5sq0flk2phit94c8ql4s.apps.googleusercontent.com',
        });

        const subscriber = auth().onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return subscriber;
    }, []);

    const authGoogle = async () => {
        try {
            // 1. Iniciar sesión nativamente con Google
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            if (!idToken) throw new Error("No se obtuvo el ID Token de Google");

            // 2. Crear credencial de Firebase con el token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // 3. Autenticar en Firebase
            const userCredential = await auth().signInWithCredential(googleCredential);
            const user = userCredential.user;

            console.log("¡Conectado a Google nativamente y guardando en Firebase!");

            // 4. Sincronizar con Firestore
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.set({
                id: user.uid,
                name: user.displayName?.split(' ')[0] || 'Usuario',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                nickname: 'plantLover_' + user.uid.substring(0, 4),
                email: user.email,
                profilePicture: user.photoURL || '',
                plantCount: 0,
                streak: 0,
                registrationDate: new Date().toISOString()
            }, { merge: true });

        } catch (error: any) {
            console.error("Error al iniciar sesión con Google nativo:", error);
        }
    };

    const authFirebaseAnonymous = async () => {
        try {
            const userCredential = await auth().signInAnonymously();
            const user = userCredential.user;

            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.set({
                id: user.uid,
                name: 'Usuario',
                lastName: 'Prueba',
                nickname: 'invitado_' + user.uid.substring(0, 4),
                email: 'anonimo@example.com',
                plantCount: 0,
                streak: 0,
                registrationDate: new Date().toISOString()
            }, { merge: true });

            console.log("Logged in and synced to Firestore!");
        } catch (e) {
            console.error("Error signing in to Firebase: ", e);
        }
    };

    const signOut = async () => {
        try {
            await auth().signOut();
            await GoogleSignin.signOut();
        } catch (e) {
            console.error(e);
        }
    };

    return { currentUser, loading, authGoogle, authFirebaseAnonymous, signOut };
}