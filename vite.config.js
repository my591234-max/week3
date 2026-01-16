import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/week3/", // 這裡一定要跟你的 Repo 名稱一樣
  plugins: [react()],
});
