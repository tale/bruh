import { find_command } from 'cli_command'
import { build_command } from 'factory_builders'
import { local_state } from 'fs_parser'
import { log } from 'interface'
import { type bruh_formula_state } from 'types'
import { exit_code } from 'utils'

export default build_command({
	name: 'autoremove',
	usage: '',
	description: 'Remove all unused packages',
	flags: []
}, async () => {
	const installed = await local_state.get_installed()
	const to_uninstall = new Array<bruh_formula_state>()

	for await (const formula of installed) {
		// This is a user-installed formula, skip it
		if (formula.linked) {
			continue
		}

		const tree = await build_removable_tree(formula, installed)
		to_uninstall.push(...tree)
	}

	if (to_uninstall.length === 0) {
		log.info('No packages to remove.')
		return exit_code.success
	}

	log.info('The following packages will be removed: %s', to_uninstall.map(formula => ''.bold(formula.name))
		.join(' '))

	const uninstall = find_command('uninstall')
	await uninstall?.run({}, to_uninstall.map(formula => formula.name))

	return exit_code.success
})

// Finds the dependencies of a formula that can be uninstalled and returns them as an array
async function build_removable_tree(formula: bruh_formula_state, installed: bruh_formula_state[]): Promise<bruh_formula_state[]> {
	const tree = new Array<bruh_formula_state>()

	const is_dependency = installed.find(installed_formula => {
		if (installed_formula.dependencies) {
			return installed_formula.dependencies.includes(formula.name)
		}

		return false
	})

	if (!is_dependency) {
		tree.push(formula)
	}

	for await (const dependency of formula.dependencies ?? []) {
		const dependency_entry = installed.find(installed_formula => installed_formula.name === dependency)

		if (!dependency_entry) {
			continue
		}

		tree.push(dependency_entry, ...await build_removable_tree(dependency_entry, installed))
	}

	return tree
}

