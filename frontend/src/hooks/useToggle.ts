import { useState, useCallback } from "react";

export const useToggle = (initialState = false): [
    boolean,
    () => void,
] => {
    const [value, setValue] = useState(initialState);

    const toggle = useCallback(() => {
        setValue((prev) => !prev);
    }, []);

    return [value, toggle];
}