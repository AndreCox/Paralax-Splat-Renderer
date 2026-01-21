// vite.config.js
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  // Set base to your repository name for GitHub Pages
  base: "/Paralax-Splat-Renderer/",

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

  build: {
    rollupOptions: {
      output: {
        // Ensure proper module format
        format: "es",
      },
    },
  },

  optimizeDeps: {
    include: [
      "three",
      "three/examples/jsm/loaders/GLTFLoader.js",
      "three/examples/jsm/controls/OrbitControls.js",
      "@sparkjsdev/spark",
    ],
  },
});
