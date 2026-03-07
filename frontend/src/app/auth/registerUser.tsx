import { useSocketAPI } from "@/context/SocketContext";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuthService } from "@/context/AuthContext";
import { Header } from "@/components/authScreenHeader";
import { AuthForm } from "@/components/authForm";

export default function RegisterUser() {

    const { register } = useAuthService();

    return (
        <>
            <Header />
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <AuthForm title="Create Account" submitText="Sign Up" onSubmit={register} />
    
                <TouchableOpacity onPress={() => router.replace("/auth")}>
                    <Text style={styles.link}>
                        Already have an account? Log In
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#1C1C1C' },
    link: { color: '#aaa', marginTop: 20, textAlign: 'center' }
});