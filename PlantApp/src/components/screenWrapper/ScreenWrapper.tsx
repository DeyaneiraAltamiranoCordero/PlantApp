//ScreenWrapper.tsx
import { View } from "react-native";
import { styles } from "./ScreenWrapper.styles";

export default function ScreenWrapper({
    children,
}: {
    children: React.ReactNode | React.ReactNode[]

}) {
    return (
        <View style={styles.container}>
            {children}
        </View>
    )
}