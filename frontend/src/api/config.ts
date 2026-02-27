import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const DEBUG_MODE = __DEV__ || process.env.NODE_ENV === 'test';

const hostUri = Constants.expoConfig?.hostUri;
const parsedIp = hostUri ? hostUri.split(':')[0] : null;

// In case we are using Android - cannot route Android emulator to 127.0.0.1
const fallbackIp = Platform.OS === 'android' ? "10.0.2.2" : "127.0.0.1";

const LOCAL_IP = Device.isDevice && parsedIp ? parsedIp : fallbackIp;
const LOCAL_PORT = "8000";

const PROD_API_URL = "https://notifications.ezragubbay.com";
const LOCAL_API_URL = `http://${LOCAL_IP}:${LOCAL_PORT}`;

export const API_URL = DEBUG_MODE ? LOCAL_API_URL : PROD_API_URL;
export const SOCKET_URL = DEBUG_MODE ? LOCAL_API_URL : PROD_API_URL;
