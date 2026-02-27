import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "@/types";
import Bcrypt from "bcrypt-react-native";

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

export const clearUserData = async () => {
    try {
        await AsyncStorage.removeItem("@userData");
    } catch (error) {
        console.error("Error clearing user data:", error);
    }
}