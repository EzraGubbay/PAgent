import { loadUserData, saveUserData } from "@/utils"
import { API_URL } from "./config"
import { AuthPayload, AuthResponse, UserData } from "@/types"

export const registerUser = async (authPayload: AuthPayload): Promise<AuthResponse> => {

    const requestOptions: RequestInit = getAuthRequestOptions(authPayload);

    const response = await fetch(
        `${API_URL}/registerUser`,
        requestOptions
    );

    const data: AuthResponse = await response.json();
    console.log(data);

    if (response.ok) {
        // Save new user data
        const userData: UserData = {
            uid: data.detail as string,
            email: authPayload.email,
            notificationToken: "",
            receiveNotifications: false,
        }
        await saveUserData(userData);
    }

    return data;
}

export const loginUser = async (authPayload: AuthPayload): Promise<AuthResponse> => {
    const requestOptions: RequestInit = getAuthRequestOptions(authPayload);

    const response = await fetch(
        `${API_URL}/login`,
        requestOptions
    );

    const data: AuthResponse = await response.json();
    console.log(data);
    
    if (response.ok) {
        // Update user data with new user ID
        const userData: UserData = {
            uid: data.detail as string,
            email: authPayload.email,
            notificationToken: "",
            receiveNotifications: false,
        }
        await saveUserData(userData);
    }

    return data;
}

export const loginWithGoogle = async (idToken: string, email: string): Promise<AuthResponse> => {
    const response = await fetch(
        `${API_URL}/auth/google`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ idToken })
        }
    );

    const data: AuthResponse = await response.json();
    console.log(data);
    
    if (response.ok) {
        // Record seamless SSO login
        const userData: UserData = {
            uid: data.detail as string,
            email: email,
            notificationToken: "",
            receiveNotifications: false,
        }
        await saveUserData(userData);
    }

    return data;
}

const getAuthRequestOptions = (authPayload: AuthPayload) => {

    return {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(authPayload)
    };
}