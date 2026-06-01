import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
    include: [
      "src/**/__tests__/**/*.test.ts",
      "api/**/__tests__/**/*.test.ts",
    ],
  },
});
