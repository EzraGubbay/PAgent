import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SocketProvider } from '@/context/SocketContext';
import { AuthProvider, useAuthService } from '@/context/AuthContext';

if (__DEV__) {
    require('@/../ReactotronConfig');
    console.log("Reactotron Configuration Loaded");
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontLoaded] = useFonts({
        GoogleSans: require("@assets/fonts/GoogleSans/GoogleSans-Regular.ttf"),
    });

    useEffect(() => {
        if (fontLoaded) {
            SplashScreen.hide();
        }
    }, [fontLoaded]);

    if (!fontLoaded) {
        return null
    }

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <SocketProvider>
                    <AuthGuard>
                        <Stack />
                    </AuthGuard>
                </SocketProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}

const AuthGuard = ({
    children,
}: {
    children: React.ReactNode,
}) => {
    const { isAuthenticated, isLoading } = useAuthService();
    const segments = useSegments();
    
    useEffect(() => {
        if (isLoading) {
            if (!isAuthenticated && segments[0] !== "auth") {
                router.replace('/auth');
            } else if (isAuthenticated) {
                router.replace('/');
            }
        }
    }, [isAuthenticated]);

    return children;
}