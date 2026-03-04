//index.tsx
import { View } from "react-native";
import UserProfile from "../src/screens/userProfile/UserProfile";

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <UserProfile />
    </View>
  );
}
