module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  moduleNameMapper: {
    "^jose$": "<rootDir>/src/__tests__/__mocks__/jose.js",
    "^uuid$": "<rootDir>/src/__tests__/__mocks__/uuid.js",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "node",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          strict: false,
          noImplicitAny: false,
          lib: ["ES2020", "DOM"],
        },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};