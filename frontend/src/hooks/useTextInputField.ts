import { useState, useRef, RefObject } from "react";
import { TextInput } from "react-native";

export const useTextInputField = (): [
    RefObject<TextInput>,
    (text: string) => void,
    () => string,
    () => void,
] => {

    const textInputRef = useRef<TextInput>(null);
    const promptContentRef = useRef("");

    const updateInput = (text: string) => {
        promptContentRef.current = text;
    }

    const getInput = () => {
        return promptContentRef.current;
    }

    const clearInput = () => {
        textInputRef.current?.clear();
        promptContentRef.current = "";
    }

    return [
        textInputRef,
        updateInput,
        getInput,
        clearInput,
    ]
}