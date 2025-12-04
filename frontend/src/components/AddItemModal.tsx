"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { useVaultStore } from "@/lib/store";
import { keyManager, encryptPassword, decryptPassword, createVaultItemPayload } from "@/lib/crypto";
import { PasswordGenerator } from "@/components/password-generator";

export default function AddItemModal() {
  const addItem = useVaultStore((s) => s.addItem);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // form fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");

  async function handleSubmit() {
    const key = keyManager.getKey();
    if (!key) {
      alert("Encryption key not available. Please login again.");
      return;
    }

    if (!name || !username || !password) {
      alert("Name, username, and password are required!");
      return;
    }

    setLoading(true);
    try {
      // Create payload with password, note, and optional URL (encrypted)
      const payload = createVaultItemPayload(password, note, url || "");

      // Encrypt the payload
      const ciphertext = await encryptPassword(payload, key);

      console.log("Sending to backend:", { name, username, ciphertext: ciphertext.substring(0, 20) + "..." });

      // Send name and username as plaintext, ciphertext contains encrypted password+note+url
      const res = await apiClient.post("/vault/items", {
        name,
        username,
        ciphertext,
      });

      console.log("Backend response:", res.data);

      // Add to store
      addItem(res.data);

      // Reset form
      setName("");
      setUsername("");
      setPassword("");
      setNote("");
      setUrl("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error creating vault item:", error);
      alert("Gagal membuat item: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white font-semibold">
          + Add Item
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#020617] border border-emerald-500/40 text-white shadow-2xl shadow-emerald-500/10">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 text-xl font-bold">Add Vault Item</DialogTitle>
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
          {loading ? "Saving..." : "Save Item"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
