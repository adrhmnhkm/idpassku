"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export function useSecureClipboard(timeout = 30000) {
    const [isCopied, setIsCopied] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const copy = useCallback((text: string) => {
        if (!navigator.clipboard) {
            console.warn("Clipboard API not available");
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);

            // Clear previous timer if exists
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            // Set timer to clear clipboard
            timerRef.current = setTimeout(() => {
                navigator.clipboard.writeText(" ").then(() => {
                    console.log("Clipboard cleared securely");
                    setIsCopied(false);
                }).catch((err) => {
                    console.error("Failed to clear clipboard:", err);
                    setIsCopied(false);
                });
            }, timeout);
        }).catch((err) => {
            console.error("Failed to copy text:", err);
            setIsCopied(false);
        });
    }, [timeout]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return { isCopied, copy };
}
