
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserData = {
    uid: string;
    username: string;
    notificationToken: string;
    receiveNotifications: boolean;
}