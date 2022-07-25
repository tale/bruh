import { constants } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'

import { config } from './config'
import { endMetric, startMetric } from './metrics'

// eslint-disable-next-line @typescript-eslint/naming-convention
const { F_OK, R_OK, W_OK } = constants

export async function preflight() {
	startMetric('preflight')
	try {
		// eslint-disable-next-line no-bitwise
		await access(config.paths.prefix, F_OK | R_OK | W_OK)
	} catch {
		await mkdir(config.paths.prefix, { recursive: true })
		await mkdir(config.paths.tiffy)
		await mkdir(config.paths.cache)
		await mkdir(config.paths.installed)
	}

	endMetric('preflight')
}
