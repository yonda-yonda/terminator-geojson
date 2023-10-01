module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jest/recommended",
  ],
  parser: "@typescript-eslint/parser",
  settings: {
    "import/resolver": {
      alias: {
        map: [["~", "./src/"]],
        extensions: [".ts", ".js", ".json"],
      },
    },
    react: {
      version: "detect",
    },
  },
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "jest"],
  ignorePatterns: [],
  rules: {
    quotes: [2, "double"],
  },
};
