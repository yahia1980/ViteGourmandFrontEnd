import { defineConfig } from "vite";
import { cpSync, mkdirSync } from "node:fs";

export default defineConfig({
    server: {
        proxy: {
            "/api": {
                target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000",
                changeOrigin: true
            }
        }
    },

    plugins: [
        {
            name: "copier-fichiers-routeur",
            closeBundle() {
                mkdirSync("dist/src", { recursive: true });

                cpSync("src/js", "dist/src/js", {
                    recursive: true,
                    force: true
                });

                cpSync("src/css", "dist/src/css", {
                    recursive: true,
                    force: true
                });

                cpSync("pages", "dist/pages", {
                    recursive: true,
                    force: true
                });
            }
        }
    ]
});