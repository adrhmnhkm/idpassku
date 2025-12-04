"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useVaultStore } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  itemId: string;
  itemName: string;
}

export function DeleteVaultItemDialog({ itemId, itemName }: Props) {
  const removeItem = useVaultStore((s) => s.removeItem);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      await apiClient.delete(`/vault/items/${itemId}`);
      removeItem(itemId);
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {/* PENTING: Jangan dibungkus button dari luar */}
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-[#020617] border border-emerald-500/40 text-white shadow-2xl shadow-emerald-500/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-emerald-400 font-bold">Hapus Item?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Item <b className="text-white">{itemName}</b> akan dihapus secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isSubmitting}
            className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-500"
          >
            {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
