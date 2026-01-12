import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

// Removed manus-runtime and jsx-loc plugins - only needed for Manus platform
const plugins = [
  react(),
  tailwindcss(),
  visualizer({
    filename: "dist/bundle-stats.html",
    open: false,
    gzipSize: true,
    brotliSize: true,
  }),
];

export default defineConfig({
  base: '/hivemind/',
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: {
          // UI primitives - Radix components (only used ones)
          'ui-primitives': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-toggle',
          ],
          // Heavy vendor libraries
          'vendor-heavy': [
            'react-markdown',
          ],
          // Icons
          'icons': [
            'lucide-react',
          ],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
