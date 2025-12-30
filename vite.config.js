const { defineConfig } = require("vite");

// Use dynamic import for ESM-only plugins
module.exports = defineConfig(async () => {
  const react = (await import("@vitejs/plugin-react")).default;
  const { VitePWA } = await import("vite-plugin-pwa");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'StudyPrint Ultimate',
          short_name: 'StudyPrint',
          description: 'The Ultimate Study Sheet Generator for Students',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    server: {
      port: 5173,
    },
  };
});

