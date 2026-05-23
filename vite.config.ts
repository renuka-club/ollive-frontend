// Vite / TanStack Start configuration
// @tanstack/react-start requires its own vite plugin bundle; we use the config
// from the scaffolded package and extend it with project-specific settings.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
