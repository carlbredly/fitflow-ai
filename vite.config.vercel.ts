import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL || ""),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ""),
    "import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ""),
    "import.meta.env.VITE_DEEPSEEK_API_KEY": JSON.stringify(process.env.VITE_DEEPSEEK_API_KEY || ""),
    "import.meta.env.VITE_APP_URL": JSON.stringify(process.env.VITE_APP_URL || ""),
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL || ""),
  },
  build: {
    outDir: "dist/client",
    sourcemap: false,
  },
});
