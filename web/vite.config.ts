import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { defineConfig } from "vite";

const commitHash = execSync("git rev-parse --short HEAD").toString();
const commitDate = execSync("git log -1 HEAD --format=%cI").toString();

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
    __BUILDDETAIL__: JSON.stringify({ buildVersion: commitHash.trim(), buildTimestamp: commitDate.trim() }),
  },
  base: "/plan-generation",
  server: {
    port: 11065,
  },
});
