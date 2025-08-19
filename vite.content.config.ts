import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
    plugins: [react()],
    publicDir: false,
    build: {
        outDir: "dist",
        emptyOutDir: false,
        rollupOptions: {
            input: {
                content: r("src/content/index.tsx"),
            },
            output: {
                format: "iife",
                inlineDynamicImports: true,
                entryFileNames: () => "content.js",
                chunkFileNames: "chunks/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][extname]",
            },
        },
    },
});
