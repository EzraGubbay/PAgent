import { useState, useRef, RefObject } from "react";
import { TextInput } from "react-native";

export const useTextInputField = (): [
    RefObject<TextInput>,
    (text: string) => void,
    () => string,
] => {

    const textInputRef = useRef<TextInput>(null);
    const promptContentRef = useRef("");

    const updateInput = (text: string) => {
        promptContentRef.current = text;
    }

    const submitInput = () => {
        const text = promptContentRef.current;
        promptContentRef.current = "";
        return text
    }

    return [
        textInputRef,
        updateInput,
        submitInput,
    ]
}