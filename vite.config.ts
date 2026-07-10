/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/badmintonExam/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    // .ts only (not .tsx) is deliberate: component tests are out of scope.
    // We only test pure functions and data integrity, so there is no jsdom
    // environment and no .test.tsx files.
    include: ['src/**/*.test.ts'],
  },
});
