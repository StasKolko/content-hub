import type { ViteUserConfig } from "vitest/config";

import solid from "vite-plugin-solid";
import { defineConfig, mergeConfig } from "vitest/config";

const baseTestConfig: ViteUserConfig["test"] = {
  globals: true,
  passWithNoTests: true,
  coverage: {
    provider: "v8",
    enabled: false,
    reportsDirectory: "./coverage",
    include: ["src/**/*.{ts,tsx}"],
    thresholds: {
      autoUpdate: false,
      perFile: true,
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    exclude: [
      "**/_tests/**/!(*.test).{ts,tsx}",

      // Tests
      "**/*.test.{ts,tsx}",

      // Types
      "**/*.d.ts",
      "**/_types.ts",
      "**/types.ts",
      "**/*.types.ts",

      // Entry points
      "**/index.ts",
      "**/run.ts",
      "**/init.ts",
    ],
  },
};

const createBackendConfig = (overrides?: ViteUserConfig) =>
  createConfig({ environment: "node" }, overrides);

const createFrontendConfig = (overrides?: ViteUserConfig) =>
  createConfig(
    { environment: "happy-dom", plugins: [solid({ hot: false })] },
    overrides,
  );

function createConfig(
  {
    environment,
    plugins = [],
  }: {
    environment: "node" | "happy-dom";
    plugins?: ViteUserConfig["plugins"];
  },
  overrides?: ViteUserConfig,
) {
  const base = defineConfig({
    plugins,
    test: {
      ...baseTestConfig,
      environment,
    },
  });

  return withOverrides(base, overrides);
}

function withOverrides(base: ViteUserConfig, overrides?: ViteUserConfig) {
  if (!overrides) {
    return base;
  }
  return mergeConfig(base, defineConfig(overrides));
}

export { createBackendConfig, createFrontendConfig };
