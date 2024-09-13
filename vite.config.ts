import { defineConfig } from "vite";

export default defineConfig((env) => ({
	publicDir: env.command === "serve" ? "public" : undefined,
	build: {
		lib: {
			entry: "./lib/index.ts",
			name: "ElkFlow",
			fileName: "elkFlow",
		},
		rollupOptions: {
			external: [],
			output: {
				globals: {},
			},
		},
	},
}));