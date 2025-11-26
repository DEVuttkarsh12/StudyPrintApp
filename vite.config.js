const { defineConfig } = require("vite");

// Use dynamic import for ESM-only plugins
module.exports = defineConfig(async () => {
  const react = (await import("@vitejs/plugin-react")).default;

  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
  };
});
