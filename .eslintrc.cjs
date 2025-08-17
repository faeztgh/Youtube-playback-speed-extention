module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
    },
    plugins: ["@typescript-eslint", "react", "react-hooks"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
    ],
    settings: {
        react: { version: "detect" },
    },
    ignorePatterns: ["dist/", "node_modules/", "public/", "chunks/", "assets/"],
    overrides: [
        {
            files: [
                "vite.config.ts",
                "postcss.config.js",
                "tailwind.config.js",
            ],
            env: { node: true },
        },
    ],
    rules: {
        "react/react-in-jsx-scope": "off",
    },
};
