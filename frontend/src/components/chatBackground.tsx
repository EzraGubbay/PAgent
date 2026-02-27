import {
    View,
    StyleSheet
} from "react-native";
import { Svg, Defs, Pattern, Circle, Rect } from "react-native-svg";

export const ChatBackgroundPattern = () => (
    <View style={StyleSheet.absoluteFillObject}>
        <Svg height="100%" width="100%">
            <Defs>
                <Pattern
                    id="dotPattern"
                    x="0"
                    y="0"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                >
                    <Circle cx="2" cy="2" r="1" fill="#333" opacity="0.3" />
                </Pattern>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotPattern)" />
        </Svg>
    </View>
)