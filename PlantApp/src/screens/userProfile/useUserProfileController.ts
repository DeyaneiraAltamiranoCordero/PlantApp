import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';

import { ApiError, getUserProfile, subscribeToApiMutations, updateUserProfile } from '../../context/services/api';
import { ISODateStringSchema } from '../../context/services/schemas';
import { useToast } from '../../context/ToastContext';
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
  const [plantsCount, setPlantsCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [favoritePlants, setFavoritePlants] = useState<string[]>([]);
  const [plantCategories, setPlantCategories] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  const uniqueStrings = (items: Array<string | undefined | null>) => {
    const normalized = items
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));
    return Array.from(new Set(normalized));
  };

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
    setPlantsCount(0);
    setStreakCount(0);
    setFriendsCount(0);
    setIsPrivate(false);
  };

  const loadProfile = useCallback(async () => {
    if (!currentUser) return;

    setIsLoadingProfile(true);
    try {
      const profile = await getUserProfile(currentUser.uid);
      if (!isMountedRef.current) return;

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

      const favoriteNamesFromEndpoint = uniqueStrings(
        profile.favoritePlants?.map((plant) => plant.name) ?? [],
      );
      const favoriteNamesFromPlants = uniqueStrings(
        (profile.plants ?? []).filter((plant) => Boolean(plant.isFavorite)).map((plant) => plant.name),
      );
      setFavoritePlants(
        favoriteNamesFromEndpoint.length > 0
          ? favoriteNamesFromEndpoint
          : favoriteNamesFromPlants,
      );

      const categoryNamesFromProfile = uniqueStrings(profile.categories?.map((category) => category.name) ?? []);
      const categoryNamesFromPlants = uniqueStrings(profile.plants?.map((plant) => plant.categoryName) ?? []);
      setPlantCategories(
        categoryNamesFromProfile.length > 0 ? categoryNamesFromProfile : categoryNamesFromPlants,
      );

      reset({
        name: profile.user.name || '',
        lastName: profile.user.lastName || '',
        secondLastName: profile.user.secondLastName || '',
        nickname: profile.user.nickname || profile.user.code || '',
        email: profile.user.email || currentUser.email || '',
        description: profile.user.description || '',
        birthday: profile.user.birthDate || '',
      });

      setProfileImage(profile.user.profilePicture || '');

      const plantsLength = Array.isArray(profile.plants) ? profile.plants.length : undefined;
      setPlantsCount(plantsLength ?? stats.plantsCount ?? 0);
      setStreakCount(profile.user.streak ?? profile.user.streakDays ?? 0);

      const friendsLength = Array.isArray(profile.friends) ? profile.friends.length : undefined;
      setFriendsCount(friendsLength ?? stats.friendsCount ?? 0);
      setIsPrivate(profile.user.isPrivate ?? profile.user.publicProfile === false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        if (!isMountedRef.current) return;
        applyFallbackProfileFromCurrentUser();
        setFavoritePlants([]);
        setPlantCategories([]);
        return;
      }
      console.error('Error al cargar el perfil:', error);
      Alert.alert('Error', 'No se pudo cargar tu perfil.');
    } finally {
      if (isMountedRef.current) {
        setIsLoadingProfile(false);
      }
    }
  }, [currentUser, reset]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadProfile();

    if (!currentUser) {
      return () => {
        isMountedRef.current = false;
      };
    }

    const unsubscribe = subscribeToApiMutations(() => {
      void loadProfile();
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [currentUser, loadProfile]);

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

      await updateUserProfile(currentUser.uid, {
        name: values.name,
        lastName: values.lastName,
        secondLastName: values.secondLastName,
        nickname: values.nickname,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        birthDate: trimmedBirthday,
        profilePicture: profileImage,
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
    plantsCount,
    streakCount,
    friendsCount,
    favoritePlants,
    plantCategories,
    isPrivate,
    setIsPrivate,
    isLoadingProfile,
    isSaving,
  };
}
