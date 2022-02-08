export type BrewFormula = {
	name: string
	versions: {
		stable: string
	}
	dependencies: string[]
	revision: string
	bottle: {
		stable?: {
			files: {
				[key: string]: {
					url: string
					sha256: string
				}
			}
		}
	}
}
