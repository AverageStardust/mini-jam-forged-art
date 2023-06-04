import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [solidPlugin()],
	server: {
		port: 3000,
	},
	build: {
		target: 'esnext',
	},
	base: "" // make vite build with relative paths for deployment
});
