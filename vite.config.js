import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/socket.io': { target: API_TARGET, ws: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
    // Run each test file in its own child process (fork) so that module-level
    // singletons (e.g. socketService) are fully isolated between files.
    // This prevents EACCES connection errors caused by socket.io-client
    // attempting real connections when its mock leaks between parallel workers.
    pool: 'forks',
    // Increase from the default 5 s so that integration-style tests (checkout
    // gateway flow, order detail load) do not flake when the full suite runs in
    // parallel on a loaded CI runner.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/tests/**', 'src/**/*.test.{js,jsx}'],
      // Course gate: >= 80% on new code (SENG 34213 s6.4)
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 75 },
    },
  },
});
