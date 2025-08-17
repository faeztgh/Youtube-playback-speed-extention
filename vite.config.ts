import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    publicDir: "public",
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(__dirname, "popup.html"),
                options: resolve(__dirname, "options.html"),
                content: resolve(__dirname, "src/content/index.tsx"),
                background: resolve(__dirname, "src/background/index.ts"),
            },
            output: {
                entryFileNames: (assetInfo) => {
                    if (assetInfo.name?.includes("content"))
                        return "content.js";
                    if (assetInfo.name?.includes("background"))
                        return "background.js";
                    return "[name].js";
                },
                chunkFileNames: "chunks/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][extname]",
            },
        },
    },
});
