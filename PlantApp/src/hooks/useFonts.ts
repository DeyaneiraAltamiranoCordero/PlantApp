import * as Font from 'expo-font';

export async function loadFonts() {
  await Font.loadAsync({
    Nunito_400Regular: require('../../assets/fonts/Nunito-Regular.ttf'),
    Nunito_600SemiBold: require('../../assets/fonts/Nunito-SemiBold.ttf'),
    Nunito_700Bold: require('../../assets/fonts/Nunito-Bold.ttf'),
  });
}
