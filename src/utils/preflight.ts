import { constants } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'

import { config } from './config'
import { endMetric, startMetric } from './metrics'

export async function preflight() {
	startMetric('preflight')
	try {
		// eslint-disable-next-line no-bitwise
		await access(config.paths.prefix, constants.F_OK | constants.R_OK | constants.W_OK)
	} catch {
		await mkdir(config.paths.prefix, { recursive: true })
		await mkdir(config.paths.cache)
		await mkdir(config.paths.installed)
	}

	endMetric('preflight')
}
