import { build_error } from 'factory_builders'
import { cache_handler } from 'fs_parser'
import { type bruh_formula } from 'types'

export async function resolve_flat(unresolved_arguments: string[]) {
	const { resolved, unresolved } = await cache_handler.resolve_deps(unresolved_arguments)

	const recurse_tasks = resolved.map(async dep => {
		try {
			const tree = await recurse_flat(dep)
			resolved.push(...tree)
		} catch (error: unknown) {
			if (error instanceof build_error.unresolved_dependency_error) {
				unresolved.push(...error.hack_dump.unresolved_dependencies)
			} else {
				throw error
			}
		}
	})

	await Promise.all(recurse_tasks)
	return { resolved, unresolved }
}

async function recurse_flat(formula: bruh_formula) {
	const { resolved, unresolved } = await cache_handler.resolve_deps(formula.dependencies)

	if (unresolved.length > 0) {
		build_error.throw_unresolved_dependency_error(formula, unresolved)
	}

	const recurse_tasks = resolved.map(async dep => {
		const tree = await recurse_flat(dep)
		resolved.push(...tree)
	})

	await Promise.all(recurse_tasks)
	return resolved
}
