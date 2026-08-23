import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Tiptap UI kit sources are maintained upstream and checked through build/typecheck.
    "components/tiptap-ui/**",
    "components/tiptap-ui-primitive/**",
    "hooks/**",
    "lib/tiptap-utils.ts",
  ]),
]);

export default eslintConfig;
