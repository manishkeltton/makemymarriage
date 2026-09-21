import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    files: ["src/app/**/*.{ts,tsx}", "src/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["mongoose", "mongodb"],
          patterns: [
            {
              group: [
                "**/*.model",
                "**/*.model.*",
                "**/*.repository",
                "**/*.repository.*",
                "**/shared/database/**",
              ],
              message:
                "Routes and components must call application services, never persistence directly.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/**", "**/modules/**"],
              message:
                "Shared infrastructure cannot depend on business modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["mongoose", "mongodb"],
          patterns: [
            {
              group: [
                "@/modules/**",
                "**/modules/**",
                "**/*.model",
                "**/*.model.*",
                "**/*.repository",
                "**/*.repository.*",
                "**/shared/database/**",
              ],
              message:
                "Shared UI must not import business modules or persistence.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "coverage/**",
    "next-env.d.ts",
    "docs/**",
  ]),
]);
