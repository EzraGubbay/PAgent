import { Attachment } from "@/types";
import { useState, useCallback } from "react";

export const useAttachments = (): [
    boolean,
    Attachment[],
    () => void,
    (attachment: Attachment) => void,
    (index: number) => void,
] => {
    const [showAttachments, setShowAttachments] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const closeAttachmentsBar = () => {
        setShowAttachments(false);
        setAttachments([]);
    }

    const addAttachment = (attachment: Attachment) => {
        setShowAttachments(true);
        setAttachments(prev => [...prev, attachment]);
    }

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    }

    return [showAttachments, attachments, closeAttachmentsBar, addAttachment, removeAttachment];
}