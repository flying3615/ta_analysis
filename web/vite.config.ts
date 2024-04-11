import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";

const commitHash = execSync("git rev-parse --short HEAD").toString();
const commitDate = execSync("git log -1 HEAD --format=%cI").toString();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProdMode = mode === "production";

  return {
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
    resolve: {
      alias: [{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) }],
    },
    base: isProdMode ? "/plan-generation/" : "/",
    server: {
      port: 11065,
      proxy: {
        "/plan-generation/config/": {
          target: "http://localhost:11065",
          selfHandleResponse: true,
          rewrite: (path) => path.replace("/plan-generation/config/", ""),
          bypass: (req, res) => {
            const requestedFileName = encodeURIComponent(req.url!.slice("/plan-generation/config/".length));
            const localFilePath = path.join(__dirname, "config/local", requestedFileName);
            console.log(`proxying ${req.url} to ${localFilePath}`);
            const data = fs.readFileSync(localFilePath, "utf-8");
            res.end(data);
          },
        },
      },
    },
  };
});
