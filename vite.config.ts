import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Exclude Node.js modules from the build
  optimizeDeps: {
    exclude: ['pg', 'pg-native']
  },
  // Avoid trying to bundle Node.js-only modules
  build: {
    commonjsOptions: {
      esmExternals: true,
    },
  },
}));
