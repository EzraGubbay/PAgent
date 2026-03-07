import { TouchableOpacity, Text, TextInput, StyleSheet, Alert, View } from "react-native"
import { useTextInputField } from "@/hooks";
import { AuthPayload } from "@/types";
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { useAuthService } from "@/context/AuthContext";
import { AntDesign } from '@expo/vector-icons';
import { GOOGLE_OAUTH_CLIENT_ID_IOS, GOOGLE_OAUTH_CLIENT_ID_WEB } from "@/api/config";

GoogleSignin.configure({
    iosClientId: GOOGLE_OAUTH_CLIENT_ID_IOS,
    webClientId: GOOGLE_OAUTH_CLIENT_ID_WEB,
    offlineAccess: true,
});

export const AuthForm = ({
    title,
    submitText,
    onSubmit,
}: {
    title: string,
    submitText: string,
    onSubmit: (authPayload: AuthPayload) => void
}) => {
    const { loginWithGoogle } = useAuthService();

    const [ emailInputRef, updateEmail, getCurrentEmail, clearEmail ] = useTextInputField();
    const [ passwordInputRef, updatePassword, getCurrentPassword, clearPassword ] = useTextInputField();

    const triggerGoogleAuth = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (isSuccessResponse(userInfo)) {
                const { idToken, user } = userInfo.data;
                if (idToken && user.email) {
                    await loginWithGoogle(idToken, user.email);
                } else {
                    Alert.alert("Error", "Missing ID Token or Email from Google.");
                }
            } else {
                console.log("Sign-in process cancelled.");
            }
        } catch (error) {
            console.log("Google Auth Failed:", error);
            Alert.alert("Authentication Failed", "There was an error authenticating with Google.");
        }
    };

    const submit = () => {
        const email = getCurrentEmail()?.trim();
        const password = getCurrentPassword();

        // Validate form input
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            Alert.alert("Error", "Please enter your email.");
            return;
        }

        if (!emailRegex.test(email)) {
            Alert.alert("Error", "Please enter a valid email address.");
            return;
        }

        if (!password) {
            Alert.alert("Error", "Please enter your password.");
            return;
        }

        // ----- Submit form -----
        const authPayload: AuthPayload = {
            email,
            password,
        }

        onSubmit(authPayload);

        // Clear password field
        clearPassword();
    }

    return (
        <>
            <Text style={styles.title}>{title}</Text>
            
            <TextInput
                style={styles.input}
                ref={emailInputRef}
                onChangeText={(email) => updateEmail(email)}
                keyboardAppearance="dark"
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => {
                    passwordInputRef.current?.focus();
                }}
            />
            <TextInput
                style={styles.input}
                ref={passwordInputRef}
                onChangeText={(password) => updatePassword(password)}
                placeholder="Password"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={submit}
            />

            <TouchableOpacity onPress={submit} style={styles.btn}>
                <Text style={styles.btnText}>{submitText}</Text>
            </TouchableOpacity>

            <View style={styles.separatorContainer}>
                <View style={styles.separator} />
                <Text style={styles.separatorText}>OR</Text>
                <View style={styles.separator} />
            </View>

            <TouchableOpacity onPress={triggerGoogleAuth} style={styles.googleBtn}>
                <AntDesign name="google" size={20} color="white" style={styles.googleIcon} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
        </>
    )
}

const styles = StyleSheet.create({
    title: { fontSize: 24, color: 'white', marginBottom: 40, textAlign: 'center' },
    input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
    btn: { backgroundColor: '#4cd137', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { fontWeight: 'bold' },
    separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    separator: { flex: 1, height: 1, backgroundColor: '#444' },
    separatorText: { color: '#888', marginHorizontal: 10, fontWeight: 'bold' },
    googleBtn: { backgroundColor: '#4285F4', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    googleIcon: { marginRight: 10 },
    googleBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});