import { defineConfig } from "vite";
import path from "path";

// Enable cross-origin isolation for SharedArrayBuffer usage in workers.
// This sets the necessary HTTP headers during `vite` dev server.
export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  resolve: {
    alias: {
      three: path.resolve(__dirname, "node_modules/three"),
    },
  },
});
