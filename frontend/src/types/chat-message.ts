import { MessageType } from "./message-type";
import { Attachment } from "../networking";

export interface ChatMessage {
    message: string;
    type: MessageType;
    attachments?: Attachment[];
}
