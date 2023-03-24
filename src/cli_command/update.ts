import { rm } from 'node:fs/promises'

import { build_command } from 'factory_builders'
import { cache_handler } from 'fs_parser'
import { log } from 'interface'
import { brew_api } from 'net_fetch'
import { type bruh_formula } from 'types'
import { config, exit_code } from 'utils'

export default build_command<{
	force: boolean;
}>({
	name: 'update',
	usage: '',
	description: 'Update the list of available formula or casks',
	flags: [
		{
			name: 'force',
			description: 'Cleans and rebuilds the entire cache',
			long_flag: '--force-update',
			short_flag: '-f'
		}
	]
}, async flags => { // We don't need cli_arguments here
	log.warning('Homebrew Casks and Taps are unsupported')

	if (flags.force) {
		log.warning('Force rebuilding the entire cache')
		await rm(config.paths.tiffy, { recursive: true })
	}

	const taps = ['homebrew/core'] // TODO: Support proper Taps
	const formulas = new Array<bruh_formula>()

	const tasks = taps.map(async tap => {
		// Official taps can be handled through the API
		if (tap.startsWith('homebrew/')) {
			log.special.update(tap)
			const core_formulas = await brew_api.fetch_formulas()
			formulas.push(...core_formulas)
		}
	})

	await Promise.all(tasks)
	await cache_handler.flush_database(formulas)

	return exit_code.success
})
