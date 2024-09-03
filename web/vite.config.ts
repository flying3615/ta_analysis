import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath, URL } from "url";
import { defineConfig, UserConfig } from "vite";

const commitHash = execSync("git rev-parse --short HEAD").toString();
const commitDate = execSync("git log -1 HEAD --format=%cI").toString();

// https://vitejs.dev/config/
export default defineConfig(
  ({ mode }): UserConfig => ({
    envDir: "viteEnv",
    plugins: [react()],
    worker: {
      format: "es",
    },
    build: {
      outDir: "build",
      assetsDir: "public",
      sourcemap: true,
      target: "esnext",
    },
    assetsInclude: ["/config/nr-config.js"],
    define: {
      "process.env": process.env,
      __BUILDDETAIL__: JSON.stringify({ buildVersion: commitHash.trim(), buildTimestamp: commitDate.trim() }),
    },
    resolve: {
      alias: [{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) }],
    },
    base: "/plan-generation/",
    server: {
      port: 11065,
      proxy: {
        "/secure-file-upload/": {
          target: "http://localhost:12999",
          changeOrigin: true,
          secure: true,
        },
        "/plan-generation/config/": {
          target: "http://localhost:11065",
          selfHandleResponse: true,
          rewrite: (path: string) => path.replace("/plan-generation/config/", ""),
          bypass: (req: http.IncomingMessage, res: http.ServerResponse) => {
            const requestedFileName = encodeURIComponent(req.url!.slice("/plan-generation/config/".length));
            let configDir = "config/local";
            if (mode === "local-nonprod" && requestedFileName === "env.json") {
              configDir = "config/nonprod";
            } else if (mode === "local-preprod" && requestedFileName === "env.json") {
              configDir = "config/preprod";
            }
            const localFilePath = path.join(__dirname, configDir, requestedFileName);
            console.log(`proxying ${req.url} to ${localFilePath}`);
            const data = fs.readFileSync(localFilePath, "utf-8");
            res.end(data);
          },
        },
      },
    },
  }),
);
