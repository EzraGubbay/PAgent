import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { AppState } from "react-native";
import io, { Socket } from "socket.io-client";
import { SOCKET_URL } from "@/api/config";
import { RegisterNotificationTokenRequest, SendMessageRequest, UserData, SocketConnectResponse } from "@/types";
import { loadUserData } from "@/utils/userData";
import { useAuthService } from "./AuthContext";

interface SocketContextData {
    socket: Socket | null;
    sendMessage: (prompt: string) => void;
    registerNotificationToken: () => void;
    isConnected: boolean,
    messageQueueFlushed: boolean,
}

const SocketContext = createContext<SocketContextData | null>(null);

export const useSocketAPI = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocketAPI must be used within a SocketProvider");
    }
    return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
    const appState = useRef(AppState.currentState);
    const [isConnected, setIsConnected] = useState(false);
    const [messageQueueFlushed, setMessageQueueFlushed] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const { authenticatedByToken, isLoading, logout } = useAuthService();

    // Initial load for user data to improve dependency injection
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
        // Delay connection until auth loading is finished
        if (isLoading) return;

        const socket = io(SOCKET_URL, {
            transports: ["websocket"],
            auth: userData?.uid ? { uid: userData.uid } : undefined,
        });

        socketRef.current = socket;
        setSocketInstance(socket);

        socket.on("connectSuccess", (data: SocketConnectResponse) => {
            setIsConnected(true);
            authenticatedByToken(data.token);
            console.log("Socket connected:", socket.id);
        });

        socket.on("connectError", (err) => {
            setIsConnected(false);
            logout();
            console.error("Socket Connection Error:", err);
        });

        socket.on("messageQueueFlushed", () => {
            setMessageQueueFlushed(true);
            console.log("Message Queue Loaded");
        })

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log("Attempting to setup WebSocket connection with the backend.")
                socket.connect();
            } else if (nextAppState.match(/inactive|background/)) {
                socket.disconnect();
            }
            appState.current = nextAppState;
        });

        return () => {
            socket.disconnect();
            subscription.remove();
            socketRef.current = null;
            setSocketInstance(null);
        };
    }, [userData?.uid]);

    // Used useCallback to optimize passed methods
    const sendMessage = useCallback((prompt: string) => {
        if (!userData?.uid) return;
        const request: SendMessageRequest = { uid: userData.uid, prompt, notificationToken: userData.notificationToken || null };
        socketRef.current?.emit("sendMessage", request);
    }, [userData?.uid, userData?.notificationToken]);

    const registerNotificationToken = useCallback(() => {
        if (!userData?.uid || !userData?.notificationToken) return;
        const request: RegisterNotificationTokenRequest = { uid: userData?.uid, notificationToken: userData?.notificationToken };
        socketRef.current?.emit("registerNotificationToken", request);
    }, [userData?.uid, userData?.notificationToken]);

    return (
        <SocketContext.Provider value={{
            socket: socketInstance,
            sendMessage,
            registerNotificationToken,
            isConnected,
            messageQueueFlushed,
        }}>
            {children}
        </SocketContext.Provider>
    );
};
