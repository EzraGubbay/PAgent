
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserData = {
    uid: string;
    username: string;
    passhash: string;
    notificationToken: string;
    receiveNotifications: boolean;
}

export const loadUserData = async () => {
    try {
        const storedData = await AsyncStorage.getItem("@userData");
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

export const saveUserData = async (userData: UserData) => {
    try {
        await AsyncStorage.setItem("@userData", JSON.stringify(userData));
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}