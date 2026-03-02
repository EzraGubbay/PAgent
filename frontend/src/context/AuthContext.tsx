import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useSocketAPI } from "./SocketContext";
import { loginUser, registerUser } from "@/api/auth";
import { AuthPayload, AuthResponse, UserData } from "@/types";
import { loadUserData, clearUserData } from "@/utils";

interface AuthContextData {
    isAuthenticated: boolean,
    isLoading: boolean,
    login: (authPayload: AuthPayload) => void,
    register: (authPayload: AuthPayload) => void,
    logout: () => void,
    authenticatedByToken: (token: string) => void,
}

const AuthContext = createContext<AuthContextData | null>(null);

export const useAuthService = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthService must be used within an AuthProvider");
    }
    return context;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { connect } = useSocketAPI();

    useEffect(() => {
        const initUser = async () => {
            const userData = await loadUserData();
            if (userData) {
                setUserData(userData);
            }
        };
        initUser();
    }, []);

    useEffect(() => {
        if (!userData) {
            setIsAuthenticated(false);
        } else {
            setIsLoading(false);
        }
    }, [userData]);

    const updateAuthStatus = async (authResult: AuthResponse) => {
        setIsAuthenticated(authResult.status);
        if (authResult.status) {
            const data = await loadUserData();
            setUserData(data);
            connect();
            router.replace('/');
        } else {
            Alert.alert("Oops! Auth Error", authResult.response);
        }
    }

    const handleLogin = async (authPayload: AuthPayload) => {
        const result: AuthResponse = await loginUser(authPayload);
        updateAuthStatus(result);
    }

    const handleRegister = async (authPayload: AuthPayload) => {
        const result: AuthResponse = await registerUser(authPayload);
        updateAuthStatus(result);
    }

    const logout = async () => {
        setIsAuthenticated(false);
        setUserData(null);
        await clearUserData();
        router.replace('/auth');
    }

    const authenticatedByToken = (token: string) => {

        // For now, validate by comparing user ID
        if (userData?.uid === token && !isLoading) {
            setIsAuthenticated(true);
            connect();
            router.replace('/');
        }
    }

    return <AuthContext.Provider value={{
        isAuthenticated,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout,
        authenticatedByToken,
    }}>
        {children}
    </AuthContext.Provider>
}