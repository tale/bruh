import { Command, Fetcher } from 'classes'
import { fs_cache_parser } from 'fs_parser'
import { log } from 'interface'
import { rm } from 'node:fs/promises'
import { BruhFormula } from 'types'
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
			longFlag: '--force-update',
			shortFlag: '-f'
		}
	]
}, async (flags, _arguments) => {
	log.warning('Homebrew Casks and Taps are unsupported')

	if (flags.force) {
		log.warning('Force rebuilding the entire cache')
		await rm(config.paths.tiffy, { recursive: true })
	}

	const taps = ['homebrew/core'] // TODO: Support proper Taps
	const formulas = new Array<BruhFormula>()

	const tasks = taps.map(async tap => {
		// Official taps can be handled through the API
		if (tap.startsWith('homebrew/')) {
			log.special.update(tap)
			const formulae = await Fetcher.API.allFormulae()
			formulas.push(...formulae)
		}
	})

	const results = await Promise.allSettled(tasks)
	results.map(promise => {
		if (promise.status === 'rejected') {
			console.log(promise)
			log.error(promise.reason)
		}
	})

	const caches = formulas.map(formula => fs_cache_parser.serialize(formula))
	await fs_cache_parser.flush_database(caches)
})
