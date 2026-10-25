
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },

    server: {
        host: "127.0.0.1",
        port: 5173,
        strictPort: true,

        watch: {
            usePolling: true,
            interval: 1000,
        },

        hmr: {
            overlay: true,
        },

        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },
            "/sanctum": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },
        },
    },
});
