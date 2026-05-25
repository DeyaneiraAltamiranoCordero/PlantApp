import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  ApiError,
  type CreateUserProfilePayload,
  createUserProfile,
  getUserByUid,
  API_BASE_URL,
} from './services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
GoogleSignin.configure({
  webClientId: '671777128731-hkd03bgupqjj5sq0flk2phit94c8ql4s.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

function stringifyError(err: unknown) {
  try {
    if (err instanceof Error) {
      const own: Record<string, unknown> = {};
      Object.getOwnPropertyNames(err).forEach((k) => (own[k] = (err as any)[k]));
      return { message: err.message, name: err.name, stack: err.stack, ...own };
    }
    return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err as object || {})));
  } catch (e) {
    try {
      return String(err);
    } catch (_) {
      return 'Unknown error';
    }
  }
}

interface AuthContextType {
  currentUser: FirebaseAuthTypes.User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  createAccountWithEmail: (payload: CreateAccountPayload) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

type CreateAccountPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  lastName?: string;
  secondLastName?: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  const buildUserProfilePayload = (
    user: FirebaseAuthTypes.User,
    overrides: Partial<CreateUserProfilePayload> = {},
  ): CreateUserProfilePayload => {
    const displayName = overrides.name ?? user.displayName ?? '';
    const [firstName, ...rest] = displayName.split(' ').filter(Boolean);
    const lastName = rest.join(' ');
    const nicknameFromEmail =
      overrides.nickname?.trim() ||
      user.email?.split('@')[0] ||
      `plantLover_${user.uid.substring(0, 4)}`;

    return {
      authUid: user.uid,
      email: overrides.email ?? user.email ?? '',
      name: displayName.trim() || firstName || 'Usuario',
      nickname: nicknameFromEmail,
      lastName: overrides.lastName ?? (lastName || undefined),
      secondLastName: overrides.secondLastName || undefined,
      profilePicture: user.photoURL ?? null,
      birthDate: overrides.birthDate || undefined,
      publicProfile: true,
      isPrivate: false,
    };
  };

  const syncUserToApi = async (
    user: FirebaseAuthTypes.User,
    overrides: Partial<CreateUserProfilePayload> = {},
  ) => {
    const basePayload = buildUserProfilePayload(user, overrides);

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

  const createAccountWithEmail = async (payload: CreateAccountPayload) => {
    if (isWeb) {
      throw new Error('La creación de cuentas con email no está habilitada en Web con esta configuración.');
    }

    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;
    const confirmPassword = payload.confirmPassword;
    const lastName = payload.lastName?.trim() || undefined;
    const secondLastName = payload.secondLastName?.trim() || undefined;

    if (!name) {
      throw new Error('El nombre es obligatorio para crear la cuenta.');
    }
    if (!email) {
      throw new Error('El correo electrónico es obligatorio para crear la cuenta.');
    }
    if (!password) {
      throw new Error('La contraseña es obligatoria para crear la cuenta.');
    }
    if (password !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden.');
    }

    const auth = getAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await syncUserToApi(credential.user, {
      name,
      email,
      lastName,
      secondLastName,
    });
    // After creating the account and syncing to backend, sign out so the user
    // is not automatically logged in. User should log in explicitly.
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('[AuthContext] Error signing out after account creation:', err);
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
    console.log('[AuthContext] SignIn result raw:', signInResult);

    // Useful quick-inspection logs for debugging DEVELOPER_ERROR
    try {
      const idToken = (signInResult as any).data?.idToken ?? (signInResult as any).idToken;
      const serverAuthCode = (signInResult as any).serverAuthCode ?? (signInResult as any).data?.serverAuthCode;
      console.log('[AuthContext] signInResult keys:', Object.keys(signInResult || {}));
      console.log('[AuthContext] idToken present?', !!idToken, 'serverAuthCode present?', !!serverAuthCode);
      if (typeof idToken === 'string') console.log('[AuthContext] idToken (head):', idToken.slice(0, 40));
      if (typeof serverAuthCode === 'string') console.log('[AuthContext] serverAuthCode:', serverAuthCode);
    } catch (e) {
      console.warn('[AuthContext] Could not introspect signInResult:', e);
    }

    // idToken used to sign in with Firebase
    const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;
    // serverAuthCode to exchange on backend for refresh_token (offline access)
    const serverAuthCode = (signInResult as any).serverAuthCode ?? signInResult.data?.serverAuthCode;

    if (!idToken) throw new Error('No se obtuvo el token de Google');

    // If we have a server auth code, send it to backend to obtain server session token
    if (serverAuthCode) {
      try {
        const resp = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: serverAuthCode }),
        });
        const respText = await resp.text();
        let parsedBody: unknown = respText;
        try { parsedBody = JSON.parse(respText); } catch (_) { /* not JSON */ }
        console.log('[AuthContext] Backend /auth/google response:', { status: resp.status, body: parsedBody });
        if (resp.ok) {
          if ((parsedBody as any)?.token) {
            await AsyncStorage.setItem('SERVER_TOKEN', (parsedBody as any).token);
            console.log('[AuthContext] Stored server session token');
          } else {
            console.warn('[AuthContext] Backend returned 200 but no token in body', parsedBody);
          }
        } else {
          console.error('[AuthContext] Backend exchange failed', resp.status, parsedBody);
        }
      } catch (err) {
        console.error('[AuthContext] Error sending serverAuthCode to backend:', stringifyError(err));
      }
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, googleCredential);
    console.log('Firebase user:', result.user.uid);
  } catch (error) {
    console.error('Error en Google Sign-In:', stringifyError(error));
    try {
      if ((error as any)?.code) console.error('[AuthContext] Google error code:', (error as any).code);
    } catch (_) {}
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
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signInWithGoogle,
        createAccountWithEmail,
        signInWithEmail,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}