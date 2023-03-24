import { type bruh_formula } from 'types'

class UnresolvedDependencyError extends Error {
	public hack_dump: {
		parent_formula: bruh_formula;
		unresolved_dependencies: string[];
	}

	constructor(formula: bruh_formula, unresolved: string[]) {
		super(`Unable to resolve the following dependencies: ${unresolved.join(', ')}`)
		this.name = 'UnresolvedDependencyError'

		this.hack_dump = {
			parent_formula: formula,
			unresolved_dependencies: unresolved
		}
	}
}

export function throw_unresolved_dependency_error(formula: bruh_formula, unresolved: string[]) {
	throw new UnresolvedDependencyError(formula, unresolved)
}

export const unresolved_dependency_error = UnresolvedDependencyError
