import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { build_command } from 'factory_builders'
import { local_state } from 'fs_parser'
import { log } from 'interface'
import { exit_code } from 'utils'

export default build_command({
	name: 'uninstall',
	usage: '<formula, ...>',
	description: 'Uninstall formulae',
	flags: [
		// {
		// 	name: 'ignore_deps',
		// 	description: 'Ignore dependencies when uninstalling',
		// 	long_flag: '--ignore-deps',
		// }
	]
}, async (_flags, cli_arguments) => {
	if (cli_arguments.length === 0) {
		log.error('No formulae specified')
		return exit_code.error
	}

	// Get all installed packages and pull their files list
	const installed = [...await local_state.get_installed()]
	const not_found = new Array<string>()
	const to_uninstall: typeof installed = []

	for (const formula of cli_arguments) {
		const formula_name = formula.toLowerCase()
		const formula_entry = installed.find(formula => formula.name === formula_name)

		if (!formula_entry) {
			not_found.push(formula_name)
			continue
		}

		to_uninstall.push(formula_entry)
	}

	if (not_found.length > 0) {
		log.error('Unable to find the following packages: %s', ''.dim(not_found.join(' ')))
		log.warning('This may include formulae which do not exist in any of your taps')

		return exit_code.error
	}

	for await (const formula of to_uninstall) {
		log.info('Uninstalling %s@%s', ''.bold(formula.name), ''.dim(formula.version))

		if (!formula.files || formula.files.length === 0) {
			continue
		}

		for await (const file of formula.files) {
			const real_file = join(formula.files_prefix, file)

			try {
				await rm(real_file, { recursive: true, force: true })
			} catch {
				log.warning('Unable to remove %s', ''.dim(file))
			}
		}

		log.info('Removed files at %s', ''.dim(formula.files_prefix))
		log.blank()
	}

	await local_state.mark_as_uninstalled(...to_uninstall.map(formula => formula.name))
	return exit_code.success
})
