"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { keyManager } from "@/lib/crypto";

const EVENTS = [
    "mousedown",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart",
    "click",
    "keypress",
];

// Default timeout: 15 minutes (in milliseconds)
const DEFAULT_TIMEOUT = 15 * 60 * 1000;

export function useAutoLock(timeout = DEFAULT_TIMEOUT) {
    const router = useRouter();
    const logout = useAuth((s) => s.logout);
    const token = useAuth((s) => s.token);

    // Use a ref to store the timer ID so we can clear it
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const lockVault = useCallback(() => {
        if (!token) return; // Already logged out

        console.log("Auto-locking vault due to inactivity...");

        // Clear encryption key
        keyManager.clearKey();

        // Logout user
        logout();

        // Redirect to main domain login page
        if (typeof window !== "undefined") {
            window.location.href = "https://idpassku.com/login";
        } else {
            router.replace("/login");
        }
    }, [token, logout, router]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (token) {
            timerRef.current = setTimeout(lockVault, timeout);
        }
    }, [token, timeout, lockVault]);

    useEffect(() => {
        if (!token) return;

        // Initial timer start
        resetTimer();

        // Add event listeners
        EVENTS.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            EVENTS.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [token, resetTimer]);

    return;
}
