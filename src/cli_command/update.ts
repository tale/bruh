import { Command } from 'classes'
import { cache_handler } from 'fs_parser'
import { log } from 'interface'
import { brew_api } from 'net_fetch'
import { rm } from 'node:fs/promises'
import { bruh_formula } from 'types'
import { config } from 'utils'

interface Flags {
	force: boolean;
}

export default new Command<Flags>({
	name: 'update',
	description: 'Update the list of available formula or casks',
	flags: [
		{
			name: 'force',
			long_flag: '--force-update',
			short_flag: '-f'
		}
	]
}, async (flags, _arguments) => {
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

	const results = await Promise.allSettled(tasks)
	results.map(promise => {
		if (promise.status === 'rejected') {
			console.log(promise)
			log.error(promise.reason)
		}
	})

	const caches = formulas.map(formula => cache_handler.serialize(formula))
	await cache_handler.flush_database(caches)
})
