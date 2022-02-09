import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['./src/index.ts'],
	format: ['cjs'],
	target: 'node16',
	splitting: false,
	platform: 'node',
	sourcemap: true,
	minify: true,
	clean: true
})
