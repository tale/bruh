import { join } from 'node:path'

import { build_command } from 'factory_builders'
import { local_state } from 'fs_parser'
import { log } from 'interface'
import { config, exit_code } from 'utils'

export default build_command<{
	all: boolean;
}>({
	name: 'list',
	usage: '[formula]',
	description: 'List all installed formulae or the files of a specific formula',
	flags: [
		{
			name: 'all',
			description: 'List all installed formulae, including unlinked ones',
			short_flag: '-a',
			long_flag: '--all'
		}
	]
}, async (flags, cli_arguments) => {
	if (cli_arguments.length === 0) {
		const installed = await local_state.get_installed()
		for (const formula of installed) {
			if (!flags.all && !formula.linked) {
				continue
			}

			log.info(formula.name)
		}
	}

	const installed = [...await local_state.get_installed()]

	for await (const formula of cli_arguments) {
		const search = installed.find(f => f.name === formula)

		if (!search) {
			log.error('Formula %s is not installed', formula)
			continue
		}

		log.info('%s@%s', ''.bold(search.name), ''.dim(search.version))
		for (const file of search.files ?? []) {
			log.raw('  %s', join(config.paths.prefix, file))
		}

		log.blank()
	}

	return exit_code.success
})
