import { find_command } from 'cli_command'
import { build_command } from 'factory_builders'
import { local_state } from 'fs_parser'
import { log } from 'interface'
import { depend_tree } from 'mod_hack'
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
	const cannot_uninstall = new Array<string>()

	for await (const formula of installed) {
		// This is a user-installed formula, skip it
		if (formula.linked) {
			const { resolved } = await depend_tree.resolve_flat([formula.name])
			cannot_uninstall.push(...resolved.map(formula => formula.name))
			continue
		}
	}

	for await (const formula of installed) {
		if (cannot_uninstall.includes(formula.name)) {
			continue
		}

		// Deduplicate the tree
		if (to_uninstall.some(uninstallable => uninstallable.name === formula.name)) {
			continue
		}

		to_uninstall.push(formula)
	}

	if (to_uninstall.length === 0) {
		log.info('No packages to remove.')
		return exit_code.success
	}

	log.info('The following packages will be removed: %s', to_uninstall.map(formula => ''.bold(formula.name))
		.join(' '))

	log.blank()
	const uninstall = find_command('uninstall')
	await uninstall?.run({}, to_uninstall.map(formula => formula.name))

	return exit_code.success
})

