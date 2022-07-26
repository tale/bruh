import { constants } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'
import { config, perf } from 'utils'

export async function preflight() {
	perf.start('preflight')

	try {
		// eslint-disable-next-line no-bitwise
		await access(config.paths.prefix, constants.F_OK | constants.R_OK | constants.W_OK)
	} catch {
		await mkdir(config.paths.prefix, { recursive: true })
		await mkdir(config.paths.cache)
	}

	perf.end('preflight')
}
