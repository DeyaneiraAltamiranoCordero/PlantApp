import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';

import { ApiError, getUserProfile, updateUserProfile, uploadUserPhoto } from '../../context/services/api';
import { ISODateStringSchema } from '../../context/services/schemas';
import { useToast } from '../../context/ToastContext';
import { usePlants } from '../../context/PlantContext';
import type { PersonalInfoFormValues } from '../../components/screenUserProfile/PersonalInfoForm';

type Params = {
  currentUser:
    | {
        uid: string;
        email?: string | null;
        displayName?: string | null;
        photoURL?: string | null;
      }
    | null
    | undefined;
};

export function useUserProfileController({ currentUser }: Params) {
  const { plants, loadPlants } = usePlants();
  const { control, handleSubmit, reset, setError } = useForm<PersonalInfoFormValues>({
    defaultValues: {
      name: '',
      lastName: '',
      secondLastName: '',
      nickname: '',
      email: '',
      birthday: '',
      description: '',
    },
  });

  const { showToast } = useToast();

  const watchedName = useWatch({ control, name: 'name' });
  const watchedNickname = useWatch({ control, name: 'nickname' });

  const [profileImage, setProfileImage] = useState('');
  const [pendingProfilePhotoBase64, setPendingProfilePhotoBase64] = useState<string | null>(null);
  const [plantsCount, setPlantsCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [favoritePlants, setFavoritePlants] = useState<string[]>([]);
  const [plantCategories, setPlantCategories] = useState<string[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const applyFallbackProfileFromCurrentUser = () => {
    if (!currentUser) return;

    const displayName = currentUser.displayName ?? '';
    const [firstName, ...restNames] = displayName.split(' ').filter(Boolean);
    const fallbackNickname =
      currentUser.email?.split('@')[0] || `plantLover_${currentUser.uid.substring(0, 4)}`;
    const derivedLastName = restNames[0] ?? '';
    const derivedSecondLastName = restNames.length > 1 ? restNames.slice(1).join(' ') : '';

    reset({
      name: firstName || fallbackNickname || 'Usuario',
      lastName: derivedLastName,
      secondLastName: derivedSecondLastName,
      nickname: fallbackNickname,
      email: currentUser.email ?? '',
      birthday: '',
      description: '',
    });

    setProfileImage(currentUser.photoURL ?? '');
    setPendingProfilePhotoBase64(null);
    setPlantsCount(0);
    setStreakCount(0);
    setFriendsCount(0);
    setIsPrivate(false);
    setFavoritePlants([]);
    setPlantCategories([]);
  };

  useEffect(() => {
    if (!currentUser) return;

    void loadPlants().catch((error) => {
      console.error('Error al cargar plantas para el perfil:', error);
    });

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (!isMounted) return;

        if (__DEV__) {
          console.log('UserProfile: loaded profile.user', profile.user);
          console.log('UserProfile: loaded description fields', {
            description: profile.user.description,
            bibliography: profile.user.bibliography,
          });
        }

        const stats = profile.stats ?? {
          plantsCount: 0,
          favoritePlantsCount: 0,
          friendsCount: 0,
        };

        reset({
          name: profile.user.name || '',
          lastName: profile.user.lastName || '',
          secondLastName: profile.user.secondLastName || '',
          nickname: profile.user.nickname || profile.user.code || '',
          email: currentUser.email || profile.user.email || '',
          description: profile.user.description || '',
          birthday: profile.user.birthDate || '',
        });

        setProfileImage(profile.user.profilePicture || '');
        setPendingProfilePhotoBase64(null);

        const plantsLength = Array.isArray(profile.plants) ? profile.plants.length : undefined;
        setPlantsCount(plantsLength ?? stats.plantsCount ?? 0);
        setStreakCount(profile.user.streak ?? profile.user.streakDays ?? 0);

        const friendsLength = Array.isArray(profile.friends) ? profile.friends.length : undefined;
        setFriendsCount(friendsLength ?? stats.friendsCount ?? 0);
        setIsPrivate(profile.user.isPrivate ?? profile.user.publicProfile === false);

        // Extract favorites and categories
        const uniqueStrings = (items: Array<string | undefined | null>) => {
          const normalized = items
            .map((item) => item?.trim())
            .filter((item): item is string => Boolean(item));
          return Array.from(new Set(normalized));
        };

        const favsFromEndpoint = uniqueStrings(profile.favoritePlants?.map((p) => p.name) ?? []);
        const favsFromPlants = uniqueStrings(
          (profile.plants ?? []).filter((p) => Boolean(p.isFavorite)).map((p) => p.name),
        );
        setFavoritePlants(favsFromEndpoint.length > 0 ? favsFromEndpoint : favsFromPlants);

        const catsFromProfile = uniqueStrings(profile.categories?.map((c) => c.name) ?? []);
        const catsFromPlants = uniqueStrings(profile.plants?.map((p) => p.categoryName) ?? []);
        setPlantCategories(catsFromProfile.length > 0 ? catsFromProfile : catsFromPlants);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          if (!isMounted) return;
          applyFallbackProfileFromCurrentUser();
          return;
        }
        console.error('Error al cargar el perfil:', error);
        Alert.alert('Error', 'No se pudo cargar tu perfil.');
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [currentUser, reset]);

  useEffect(() => {
    const uniqueStrings = (items: Array<string | undefined | null>) => {
      const normalized = items
        .map((item) => item?.trim())
        .filter((item): item is string => Boolean(item));
      return Array.from(new Set(normalized));
    };

    const nextFavoritePlants = uniqueStrings(
      plants.filter((plant) => Boolean(plant.isFavorite)).map((plant) => plant.name),
    );
    const nextCategories = uniqueStrings(
      plants.map((plant) => plant.categoryName),
    );

    if (nextFavoritePlants.length > 0) {
      setFavoritePlants(nextFavoritePlants);
    }
    if (nextCategories.length > 0) {
      setPlantCategories(nextCategories);
    }
  }, [plants]);

  const onSubmit = async (values: PersonalInfoFormValues) => {
    if (!currentUser) return;
    try {
      setIsSaving(true);

      const trimmedDescription = values.description?.trim();
      const trimmedBirthday = values.birthday?.trim() ?? '';

      if (trimmedBirthday.length > 0) {
        const parsed = ISODateStringSchema.safeParse(trimmedBirthday);
        if (!parsed.success) {
          const message = parsed.error.issues[0]?.message ?? 'Usá el formato YYYY-MM-DD.';
          setError('birthday', { type: 'validate', message });
          showToast({
            kind: 'error',
            title: 'Cumpleaños inválido',
            message,
          });
          return;
        }
      }

      let nextProfilePicture: string | undefined = profileImage?.startsWith('http') ? profileImage : undefined;

      if (pendingProfilePhotoBase64) {
        try {
          nextProfilePicture = await uploadUserPhoto(
            currentUser.uid,
            `profile_${currentUser.uid}.jpg`,
            pendingProfilePhotoBase64,
          );
          setProfileImage(nextProfilePicture);
          setPendingProfilePhotoBase64(null);
        } catch (photoError) {
          console.error('No se pudo subir la foto de perfil, guardamos el resto del perfil:', photoError);
          showToast({
            kind: 'warning',
            title: 'Foto pendiente',
            message: 'Guardamos tu perfil, pero no pudimos subir la foto todavía.',
          });
          nextProfilePicture = undefined;
        }
      }

      await updateUserProfile(currentUser.uid, {
        name: values.name,
        lastName: values.lastName,
        secondLastName: values.secondLastName,
        nickname: values.nickname,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        birthDate: trimmedBirthday,
        ...(nextProfilePicture ? { profilePicture: nextProfilePicture } : {}),
        publicProfile: !isPrivate,
      });

      showToast({
        kind: 'success',
        title: 'Aviso',
        message: 'Cambios guardados con éxito.',
      });
    } catch (error) {
      console.error('Error al guardar:', error);
      showToast({
        kind: 'error',
        title: 'Error',
        message: 'No se pudieron guardar los cambios.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    control,
    handleSubmit,
    onSubmit,
    watchedName,
    watchedNickname,
    profileImage,
    setProfileImage,
    pendingProfilePhotoBase64,
    setPendingProfilePhotoBase64,
    plantsCount,
    streakCount,
    friendsCount,
    isPrivate,
    setIsPrivate,
    favoritePlants,
    plantCategories,
    isLoadingProfile,
    isSaving,
  };
}
