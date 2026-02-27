import { MessageType } from "./messageType";
import { Attachment } from "@/types";

export interface ChatMessage {
    message: string;
    type: MessageType;
    attachments?: Attachment[];
}
