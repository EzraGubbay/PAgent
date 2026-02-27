export class ServerSideError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ServerSideError";
    }
}