import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
    plugins: [react()],
    publicDir: "public",
    build: {
        outDir: "dist",
        emptyOutDir: true,
        // Chrome extension pages flag Vite's injected <link rel="modulepreload">
        // as unused ("cross-world extension resource mismatch"). Disable it.
        modulePreload: false,
        rollupOptions: {
            input: {
                popup: r("popup.html"),
                options: r("options.html"),
                background: r("src/background/index.ts"),
            },
            output: {
                entryFileNames: (assetInfo) => {
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
