import axios from "axios";

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error("❌ NEXT_PUBLIC_API_URL is NOT defined!");
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
