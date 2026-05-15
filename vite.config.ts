import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
    }),
  ],
  build: {
    lib: {
      entry: 'src/detector.ts',
      formats: ['es'],
      fileName: (format, entryName) => {
        if (entryName === 'detector') return 'mermaid-patch.core.mjs';
        return `${entryName}.mjs`;
      },
    },
    rollupOptions: {
      // elkjs needs Worker support in Node — bundle it directly
      external: ['mermaid'],
      output: {
        exports: 'named',
      },
    },
    minify: false,
    sourcemap: true,
  },
  test: {
    pool: 'forks',
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
