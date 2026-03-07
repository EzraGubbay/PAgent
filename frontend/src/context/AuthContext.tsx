import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useSocketAPI } from "./SocketContext";
import { loginUser, registerUser, loginWithGoogle } from "@/api/auth";
import { AuthPayload, AuthResponse, UserData } from "@/types";
import { loadUserData, clearUserData, saveTokens, clearTokens } from "@/utils";

import { getAuth, signInWithEmailAndPassword } from "@react-native-firebase/auth";
import { API_URL } from "@/api/config";

interface AuthContextData {
    isAuthenticated: boolean,
    isLoading: boolean,
    login: (authPayload: AuthPayload) => void,
    register: (authPayload: AuthPayload) => void,
    logout: () => void,
    authenticateByToken: (token: string) => void,
    loginWithGoogle: (idToken: string, email: string) => Promise<boolean>,
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
            
            // Securely save JWTs
            if (authResult.accessToken && authResult.refreshToken) {
                await saveTokens(authResult.accessToken, authResult.refreshToken);
            }
            
            const data = await loadUserData();
            setUserData(data);
            connect();
            router.replace('/');
        } else {
            Alert.alert("Oops! Auth Error", authResult.detail);
        }
    }

    const handleLogin = async (authPayload: AuthPayload): Promise<boolean> => {
        console.log(`DEBUG: Login attempt started.\nPayload:\n${authPayload.email}\n${authPayload.password}`)
        const result: AuthResponse = await loginUser(authPayload);
        console.log(`DEBUG: Login attempt finished.\nResult:\n${result.status}\n${result.detail}`)
        updateAuthStatus(result);
        console.log(`AuthStatus updated with status: ${result.status}`)

        return result.status;
    }

    const handleRegister = async (authPayload: AuthPayload): Promise<boolean> => {
        const result: AuthResponse = await registerUser(authPayload);
        updateAuthStatus(result);

        return result.status;
    }

    const logout = async () => {
        setIsAuthenticated(false);
        setUserData(null);
        await clearUserData();
        await clearTokens();
        router.replace('/auth');
    }

    const handleLoginWithGoogle = async (idToken: string, email: string): Promise<boolean> => {
        const result: AuthResponse = await loginWithGoogle(idToken, email);
        updateAuthStatus(result);
        return result.status;
    }

    // const handleSignIn = async (authPayload: AuthPayload): Promise<boolean> => {
    //     getAuth()
    //     .signInWithEmailAndPassword(authPayload.email, authPayload.password)
    //     .then(() => {
    //         console.log("User signed in.");
    //         setIsAuthenticated(true);
    //         connect();
    //         router.replace('/');
    //         return true;
    //     })
    //     .catch((error) => {
    //         console.error("Error signing in:", error);
    //         Alert.alert("Error signing in");
    //         return false;
    //     })
    // }

    // const handleSignUp = async (authPayload: AuthPayload): Promise<boolean> => {
    //     let result: boolean;
    //     getAuth()
    //     .createUserWithEmailAndPassword(authPayload.email, authPayload.password)
    //     .then(() => {
    //         console.log("User created successfully.");
    //         setIsAuthenticated(true);
    //         connect();
    //         router.replace('/');
    //         result = true;
    //     })
    //     .catch((error) => {
    //         console.error("Error creating user", error);
    //         Alert.alert("Error creating user");
    //         result = false;
    //     });

    //     return result;
    // }

    const authenticateByToken = (token: string) => {

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
        authenticateByToken,
        loginWithGoogle: handleLoginWithGoogle,
    }}>
        {children}
    </AuthContext.Provider>
}