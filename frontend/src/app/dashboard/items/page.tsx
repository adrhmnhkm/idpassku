"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth, useVaultStore } from "@/lib/store";
import AddItemModal from "@/components/AddItemModal";
import { DeleteVaultItemDialog } from "@/components/vaults/delete-vault-item-dialog";
import { EditVaultItemDialog } from "@/components/vaults/edit-vault-item-dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Key, User } from "lucide-react";
import { useSecureClipboard } from "@/hooks/use-secure-clipboard";
import { keyManager, decryptPassword, parseVaultItemPayload } from "@/lib/crypto";

export default function VaultItemsPage() {
  const token = useAuth((s) => s.token);
  const { items, setItems } = useVaultStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await apiClient.get("/vault/items");
        console.log("RESPONSE FROM BACKEND:", res.data);
        setItems(res.data.items || []);
      } catch (err: any) {
        console.error("Error fetching items:", err);
        setError(err?.response?.data?.message || "Error fetching items");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchItems();
    }
  }, [token, setItems]);

  if (loading) return <p className="text-emerald-300 text-lg">Loading...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-neon-emerald-bright">Vault Items</h1>
        <AddItemModal />
      </div>

      {items.length === 0 ? (
        <div className="card-modern-dark rounded-xl p-8 text-center">
          <p className="text-gray-400 italic text-lg">Belum ada item.</p>
          <p className="text-gray-500 text-sm mt-2">Klik "Add Item" untuk menambahkan password pertama Anda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <VaultItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function VaultItemCard({ item }: { item: any }) {
  const { isCopied: isUserCopied, copy: copyUser } = useSecureClipboard();
  const { isCopied: isPassCopied, copy: copyPass } = useSecureClipboard();

  const handleCopyPassword = async () => {
    const key = keyManager.getKey();
    if (!key) {
      alert("Encryption key not available. Please login again.");
      return;
    }

    try {
      if (!item.ciphertext) throw new Error("Ciphertext is empty");

      const plaintext = await decryptPassword(item.ciphertext, key);
      const data = parseVaultItemPayload(plaintext);
      copyPass(data.password);
    } catch (error) {
      console.error("Failed to decrypt password for copy:", error);
      alert("Gagal mendekripsi password.");
    }
  };

  return (
    <div
      className="card-modern-dark rounded-xl p-5 hover:emerald-glow transition-all duration-300"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-white font-semibold text-xl">{item.name || "Unnamed"}</p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-emerald-300"
                onClick={() => copyUser(item.username)}
                title="Copy Username"
              >
                {isUserCopied ? <Check className="h-3 w-3" /> : <User className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-emerald-300"
                onClick={handleCopyPassword}
                title="Copy Password"
              >
                {isPassCopied ? <Check className="h-3 w-3" /> : <Key className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          <p className="text-emerald-300 text-sm mb-2">
            <span className="text-gray-400">Username:</span> {item.username || "N/A"}
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>ID: {item.id.substring(0, 8)}...</span>
            <span>
              {new Date(item.createdAt).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <EditVaultItemDialog item={item} />
          <DeleteVaultItemDialog
            itemId={item.id}
            itemName={item.name || "Unnamed"}
          />
        </div>
      </div>
    </div>
  );
}

