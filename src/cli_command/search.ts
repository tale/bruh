import { access, constants } from 'node:fs/promises'

import { build_command } from 'factory_builders'
import { cache_handler } from 'fs_parser'
import { log } from 'interface'
import { config, exit_code } from 'utils'

export default build_command({
	name: 'search',
	usage: '<formula/cask ...>',
	description: 'Search for formulae or casks by name',
	flags: []
}, async (_, cli_arguments) => {
	if (cli_arguments.length === 0) {
		log.error('No search query supplied')
		return 1
	}

	try {
		// Checking if our update cache is readable
		await access(config.paths.tiffy, constants.R_OK)
	} catch {
		log.error('No available package indexes.')
		log.error('Try running %s to resolve this.', ''.bold(`${config.bin_entry} update`))
		return exit_code.error
	}

	const deps = await cache_handler.search_deps(cli_arguments)
	for (const dep of deps) {
		log.info(dep)
	}

	return exit_code.success
})
