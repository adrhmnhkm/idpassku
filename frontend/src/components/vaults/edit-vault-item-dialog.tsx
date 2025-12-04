"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useVaultStore, VaultItem } from "@/lib/store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    keyManager,
    encryptPassword,
    decryptPassword,
    createVaultItemPayload,
    parseVaultItemPayload,
} from "@/lib/crypto";
import { PasswordGenerator } from "@/components/password-generator";

interface Props {
    item: VaultItem;
}

export function EditVaultItemDialog({ item }: Props) {
    const updateItem = useVaultStore((s) => s.updateItem);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form fields - name and username from item metadata
    const [name, setName] = useState(item.name);
    const [username, setUsername] = useState(item.username);
    const [password, setPassword] = useState("");
    const [note, setNote] = useState("");
    const [url, setUrl] = useState("");

    const [decrypted, setDecrypted] = useState(false);

    // Decrypt password, note, and url when dialog opens
    useEffect(() => {
        if (open && keyManager.hasKey() && !decrypted) {
            const key = keyManager.getKey();
            if (key) {
                decryptPassword(item.ciphertext, key)
                    .then((plaintext) => {
                        const data = parseVaultItemPayload(plaintext);
                        setPassword(data.password);
                        setNote(data.note);
                        setUrl(data.url || "");
                        setDecrypted(true);
                    })
                    .catch((error) => {
                        console.error("Error decrypting:", error);
                        setPassword("");
                        setNote("");
                    });
            }
        } else if (open && !keyManager.hasKey()) {
            alert("Encryption key not available. Please login again.");
            setOpen(false);
        }
    }, [open, item, decrypted]);

    async function handleSubmit() {
        if (!password) {
            alert("Password is required");
            return;
        }

        const key = keyManager.getKey();
        if (!key) {
            alert("Encryption key not available. Please login again.");
            return;
        }

        setLoading(true);
        try {
            // Create payload with password, note, and optional URL (encrypted)
            const payload = createVaultItemPayload(password, note, url || "");

            // Encrypt the payload
            const ciphertext = await encryptPassword(payload, key);

            // Send name and username as plaintext, ciphertext contains encrypted password+note+url
            const res = await apiClient.put(`/vault/items/${item.id}`, {
                name,
                username,
                ciphertext,
                version: item.version,
            });

            // Update the item in store
            const updatedItem: VaultItem = {
                ...res.data,
            };

            updateItem(updatedItem);
            setOpen(false);
            setDecrypted(false);
        } catch (error) {
            console.error("Error updating vault item:", error);
            alert("Gagal mengupdate item.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-400 bg-transparent transition-all duration-200">
                    Edit
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-[#020617] border border-emerald-500/40 text-white shadow-2xl shadow-emerald-500/10">
                <DialogHeader>
                    <DialogTitle className="text-emerald-400 text-xl font-bold">Edit Vault Item</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <Input
                        placeholder="Name (ex: Server Root)"
                        className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-gray-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Input
                        placeholder="Username"
                        className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-gray-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <Input
                        placeholder="Website URL (ex: https://example.com/login)"
                        className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-gray-500"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <Input
                            placeholder="Password"
                            type="password"
                            className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-gray-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <PasswordGenerator onSelect={setPassword} />
                    </div>

                    <Textarea
                        placeholder="Notes"
                        className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20 placeholder:text-gray-500 min-h-[100px]"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <Button
                    disabled={loading}
                    onClick={handleSubmit}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
