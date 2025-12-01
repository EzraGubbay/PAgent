export class ServerSideError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ServerSideError";
    }
}

export const sendMessage = async (message: string) => {
    const response = await fetch("https://notifications.ezragubbay.com/sendMessage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }),
    });

    if (response.status >= 500) {
        throw new ServerSideError(`HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
};