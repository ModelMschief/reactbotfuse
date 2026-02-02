import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],

    // Relative paths for GitHub Pages / any subdirectory deployment
    base: './',

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },

    build: {
        outDir: 'dist',

        // Aggressive bundling for < 20 files
        rollupOptions: {
            output: {
                // Bundle all vendor dependencies into single file
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
                // Consistent file naming
                entryFileNames: 'assets/index.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]'
            }
        },

        // Use terser for aggressive minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    }
});
