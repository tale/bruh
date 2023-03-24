import { F_OK, R_OK, W_OK } from 'node:constants'
import { access, mkdir } from 'node:fs/promises'

import { config, perf } from 'utils'

export async function preflight() {
	perf.start('preflight')

	try {
		// eslint-disable-next-line no-bitwise
		await access(config.paths.prefix, F_OK | R_OK | W_OK)
	} catch (error) {
		console.log(error)
		await mkdir(config.paths.prefix, { recursive: true })
		await mkdir(config.paths.cache)
	}

	perf.end('preflight')
}
