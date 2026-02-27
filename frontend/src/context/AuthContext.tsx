import { loginUser, registerUser } from "@/api/auth";
import { AuthPayload, SocketConnectResponse, UserData } from "@/types";
import { loadUserData, clearUserData } from "@/utils";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

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

    const handleLogin = async (authPayload: AuthPayload) => {
        const status = await loginUser(authPayload);
        setIsAuthenticated(status);
        if (status) {
            const data = await loadUserData();
            setUserData(data);
        }
        router.replace('/');
    }

    const handleRegister = async (authPayload: AuthPayload) => {
        const status = await registerUser(authPayload);
        setIsAuthenticated(status);
        if (status) {
            const data = await loadUserData();
            setUserData(data);
        }
        router.replace('/');
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