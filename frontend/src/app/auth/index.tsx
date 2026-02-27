import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { loadUserData } from "@/utils/userData";
import { Header } from '@/components/authScreenHeader';
import { useAuthService } from '@/context/AuthContext';
import { AuthForm } from '@/components/authForm';

// Props to let us tell the parent component we are done
export default function AuthScreen({ navigation, route }: { navigation: any, route: any }) {

    const { login } = useAuthService();

    const handleSubmit = async (username: string, password: string) => {
        if (!username || !password) return;

        login({
            username: username,
            password: password,
        })
    };

    return (
        <>
            <Header />
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <AuthForm title="Welcome Back" handleSubmit={handleSubmit} />

                <TouchableOpacity onPress={() => router.replace("/auth/registerUser")}>
                    <Text style={styles.link}>
                        New here? Sign Up
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