import { defineConfig, devices } from '@playwright/test';

// Menjalankan server dev (mode demo, tanpa env Supabase). Instal browser: npx playwright install chromium
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-360', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } } },
  ],
});
