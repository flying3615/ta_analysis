import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    assetsDir: "public",
    sourcemap: true,
    target: "esnext",
  },
  define: {
    "process.env": process.env,
  },
  base: "/plan-generation",
  server: {
    port: 11065,
  },
});
