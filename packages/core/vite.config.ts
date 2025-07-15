import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: 'tsconfig.json',
      entryRoot: 'src',
      outDir: 'dist',
      rollupTypes: true // bundle declaration files into one
    })
  ],
  build: {
    target: 'es2020',
    sourcemap: true,
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      // external dependencies should stay external, not bundled
      external: [/^node:/, 'aiwrapper', 'reptree']
    },
    emptyOutDir: true
  }
}); 