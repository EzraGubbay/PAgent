import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainScreen from './screens/MainScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { loadUserData } from './types/data';
import { MenuProvider } from 'react-native-popup-menu';

const Stack = createNativeStackNavigator();

export default function App() {
  // AsyncStorage.getItem('@userData').then((data) => {
  //   AsyncStorage.setItem('@userData', JSON.stringify({
  //     uid: "PLACEHOLDER_UID",
  //     username: "username",
  //     name: "User Name",
  //     notificationToken: "PLACEHOLDER_TOKEN",
  //     receiveNotifications: true,
  //   }));
  // });

  // AsyncStorage.setItem('@chatHistory', JSON.stringify([]));


  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userData = await loadUserData();
      setIsUserLoggedIn(!!userData);
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      setIsAppLoading(false);
    }
  };

  if (isAppLoading) {
    return <View style={{ flex: 1, backgroundColor: '#1C1C1C' }} />;
  }

  return (
    <SafeAreaProvider>
      <MenuProvider customStyles={{ backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isUserLoggedIn ? (
              <>
                <Stack.Screen
                  name="Main"
                  component={MainScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Settings" component={SettingsScreen} />
              </>
            ) : (
              <Stack.Screen name="Auth">
                {(props) => <AuthScreen {...props} onLoginSuccess={() => setIsUserLoggedIn(true)} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </MenuProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
