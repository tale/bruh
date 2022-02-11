import { Command, Fetcher } from 'classes'
import { log } from 'interface'
import { createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { BruhFormula } from 'types'
import { config } from 'utils'

interface Flags {
	force: boolean
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
}, async (flags, _args) => {
	log.warning('Homebrew Casks and Taps are unsupported')

	if (flags.force) {
		log.warning('Force rebuilding the entire cache')
		await rm(config.paths.tiffy, { recursive: true })
	}

	await mkdir(config.paths.tiffy, { recursive: true })

	const taps = ['homebrew/core'] // TODO: Support proper Taps
	const tasks = taps.map(async tap => {
		// Official taps can be handled through the API
		if (tap.startsWith('homebrew/')) {
			log.special.update(tap)
			const data = await Fetcher.API.allFormulae()
			const cachePath = join(config.paths.tiffy, `${tap.replaceAll('/', '-')}.bruh`)
			await writeFormulae(data, cachePath)
		}
	})

	const results = await Promise.allSettled(tasks)
	results.map((promise) => {
		if (promise.status === 'rejected') {
			console.log(promise)
			log.error(promise.reason)
		}
	})
})

const writeFormulae = async (formulae: BruhFormula[], path: string) => {
	return new Promise((resolve, reject) => {
		const stream = createWriteStream(path)
		formulae.map(({ name, version, revision, blob, dependencies }) => {
			const format = `${name}$${version}$$${revision}$$$${blob}$$$$${dependencies.join()}\n`
			stream.write(format)
		})

		stream.on('error', reject)
		stream.on('finish', resolve)
	})
}
