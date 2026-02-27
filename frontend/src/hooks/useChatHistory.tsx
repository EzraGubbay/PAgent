import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatMessage } from "@/types";
import { useToggle } from "./useToggle";
import { saveUserData } from "@/utils";

export const useChatHistory = (): [
    ChatMessage[],
    (message: ChatMessage) => void,
] => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isHistoryLoaded, toggleHistoryLoaded] = useToggle();

    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                const storedHistory = await AsyncStorage.getItem("@chatHistory");
                if (storedHistory) {
                    setHistory(JSON.parse(storedHistory));
                }
            } catch (error) {
                console.error("Error loading message history:");
                console.error(error);
            }
        }

        loadChatHistory();
        toggleHistoryLoaded();
    }, []);

    useEffect(() => {
        if (isHistoryLoaded) {
            const historyJSON = JSON.stringify(history);
            AsyncStorage.setItem("@chatHistory", historyJSON)
            .catch((error) => console.log(error));
        }
    }, [history, isHistoryLoaded])

    const addChatMessage = (message: ChatMessage) => {
        setHistory(prev => [...prev, message]);
    }

    return [
        history,
        addChatMessage,
    ]
}