"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface VaultItem {
  id: string;
  name: string;
  username: string;
  ciphertext: string;
  note?: string;
  version?: number;
  createdAt: string;
  updatedAt?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (t: string) => void;
  setRefreshToken: (t: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setToken: (t) => set({ token: t }),
      setRefreshToken: (t) => set({ refreshToken: t }),
      logout: () => set({ token: null, refreshToken: null }),
    }),
    {
      name: "indovault-auth", // nama key di localStorage
    }
  )
);

interface VaultState {
  items: VaultItem[];
  setItems: (items: VaultItem[]) => void;
  addItem: (item: VaultItem) => void;
  removeItem: (id: string) => void;
  updateItem: (item: VaultItem) => void;
}

export const useVaultStore = create<VaultState>()((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateItem: (item) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === item.id ? item : i)),
    })),
}));
