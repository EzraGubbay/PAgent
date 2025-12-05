import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUserData } from '../types/data';

const SOCKET_URL = "https://notifications.ezragubbay.com";

// Props to let us tell the parent component we are done
export default function AuthScreen({ navigation, onLoginSuccess }: { navigation: any, onLoginSuccess: () => void }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const socketRef = useRef<any>(null);

    useEffect(() => {
        // 1. Initialize
        socketRef.current = io(SOCKET_URL, {
            transports: ["websocket"],
        });

        const socket = socketRef.current;

        // 2. Debug Listeners
        socket.on("connect", () => {
            console.log("Auth Socket connected successfully:", socket.id);
        });

        socket.on("connect_error", (err: any) => {
            console.error("Auth Socket Connection Error:", err.message);
        });

        // 3. Listen for result
        socket.on('auth_response', async (data: any) => {
            console.log("Server replied:", data);
            if (data.status === 'success') {
                await AsyncStorage.setItem('@userData', JSON.stringify({
                    ...await loadUserData(),
                    uid: data.response,
                    username: username
                }));
                onLoginSuccess();
            } else {
                Alert.alert("Error", data.message || "Authentication failed");
            }
        });

        return () => socket.disconnect();
    }, [username]);

    const handleSubmit = () => {
        if (!username || !password) return;

        const event = isRegistering ? 'registerUser' : 'login';
        socketRef.current.emit(event, { username: username, passhash: password });
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <Text style={styles.title}>{isRegistering ? "Create Account" : "Welcome Back"}</Text>

            <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />

            <TouchableOpacity onPress={handleSubmit} style={styles.btn}>
                <Text style={styles.btnText}>{isRegistering ? "Sign Up" : "Log In"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                <Text style={styles.link}>
                    {isRegistering ? "Already have an account? Log In" : "New here? Sign Up"}
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#1C1C1C' },
    title: { fontSize: 24, color: 'white', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
    btn: { backgroundColor: '#4cd137', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { fontWeight: 'bold' },
    link: { color: '#aaa', marginTop: 20, textAlign: 'center' }
});