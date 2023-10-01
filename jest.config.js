module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "js"],
  testPathIgnorePatterns: [],
  moduleNameMapper: {},
  transform: {
    "^.+\\.m?[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  testMatch: [
    "**/src/**/*.test.ts"
  ],
};