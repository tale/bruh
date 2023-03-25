export type bruh_formula = {
	name: string;
	version: string;
	blob: string;
	dependencies: string[];
	revision: number;
}

export type bruh_formula_state = bruh_formula & {
	linked: boolean;
	files: string[];
	files_prefix: string;
}

