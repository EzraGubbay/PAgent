import { loadUserData, saveUserData } from "@/utils"
import { API_URL } from "./config"
import { AuthPayload, AuthResponse, UserData } from "@/types"

export const registerUser = async (authPayload: AuthPayload): Promise<AuthResponse> => {

    const requestOptions: RequestInit = getAuthRequestOptions(authPayload);

    try {
        const response = await fetch(
            `${API_URL}/registerUser`,
            requestOptions
        );

        if (!response.ok) {
            console.log(response);
            const errorData: AuthResponse = await response.json();
            throw new Error(errorData.response || "Network response was not ok");
        }

        const data: AuthResponse = await response.json();
        console.log(data.response);

        // Save new user data
        const userData: UserData = {
            uid: data.response,
            username: authPayload.username,
            notificationToken: "",
            receiveNotifications: false,
        }
        await saveUserData(userData);

        return {
            status: true,
            response: data.response,
        };
    } catch (error) {
        console.error("Error: ", error);
        return {
            status: false,
            response: String(error),
        };
    }
}

export const loginUser = async (authPayload: AuthPayload): Promise<AuthResponse> => {
    const requestOptions: RequestInit = getAuthRequestOptions(authPayload);

    try {
        const response = await fetch(
            `${API_URL}/login`,
            requestOptions
        );
        
        console.log(response);
        if (!response.ok) {
            const errorData: AuthResponse = await response.json();
            throw new Error(errorData.response || "Network response was not ok");
        }

        const data: AuthResponse = await response.json();
        console.log(data.response);
        
        // Update user data with new user ID
        const userData: UserData = {
            uid: data.response,
            username: authPayload.username,
            notificationToken: "",
            receiveNotifications: false,
        }
        await saveUserData(userData);

        return {
            status: true,
            response: data.response,
        }
    } catch (error) {
        console.error("Error: ", error);
        return {
            status: false,
            response: String(error),
        }
    }
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