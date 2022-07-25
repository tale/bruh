export type BrewFormula = {
	name: string;
	versions: {
		stable: string;
	};
	dependencies: string[];
	revision: string;
	bottle: {
		stable?: {
			files: Record<string, {
				url: string;
				sha256: string;
			}>;
		};
	};
}
