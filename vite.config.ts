
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Allow external access
    port: 8080,
    fs: {
      allow: [".."],
    },
  },
  preview: {
    host: "0.0.0.0", // Allow external access for preview mode
    port: 8080,
    allowedHosts: ["ai-human-cost-comparator.onrender.com"], // Allow Render host
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
