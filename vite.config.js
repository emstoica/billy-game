import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/aventura-lui-billy/",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    // Minify build
    minify: true,

    rollupOptions: {
      // Main entry point
      input: {
        main: resolve(process.cwd(), "index.html"),
      },

      // Ensure static assets are copied
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
