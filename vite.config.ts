import type { UserConfigExport } from "vite";
import app from "./vite.app.config";
import content from "./vite.content.config";

export default ((env): UserConfigExport => {
    const mode = env?.mode || process.env.BUILD_TARGET;
    if (mode === "content" || process.env.BUILD_TARGET === "content")
        return content;
    if (mode === "app" || process.env.BUILD_TARGET === "app") return app;
    throw new Error(
        "Specify which config to use: set BUILD_TARGET=content or BUILD_TARGET=app, or run the associated npm scripts.",
    );
}) as unknown as UserConfigExport;
