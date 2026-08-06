import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'KaizechChatWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@kaizech/chat-core': path.resolve(__dirname, '../../libs/chat-core/src'),
    },
  },
});
