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

com.googleusercontent.apps.179693221872-h4078jr50ml2gfk7460g46vpjee4sd86

// Third-party Auth Config
export const GOOGLE_OAUTH_CLIENT_ID_IOS = "179693221872-h4078jr50ml2gfk7460g46vpjee4sd86.apps.googleusercontent.com";
export const GOOGLE_OAUTH_CLIENT_ID_WEB = "179693221872-rcpbqb4rfh5lrmqd17lo092244ign97r.apps.googleusercontent.com";

