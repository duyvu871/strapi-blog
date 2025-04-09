import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
	...options,
	entry: ["./src/**/*"],
	format: ["esm", "cjs"],
	clean: true, // clean the dist folder before bundling
	bundle: true, // bundle all dependencies, except "devDependencies"
	// dts: true, // enable .d.ts generation
	tsconfig: "./tsconfig.json",
	platform: 'node',
	watch: "./src/**/*",
}));