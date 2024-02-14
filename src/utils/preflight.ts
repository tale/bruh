import { F_OK, R_OK, W_OK } from 'node:constants'
import { access } from 'node:fs/promises'
import { exit } from 'node:process'

import { log } from 'interface'
import { config, exit_code, perf, sudo } from 'utils'

export async function preflight(fix = true) {
	perf.start('preflight')
	process.title = 'bruh'
	let status = true

	try {
		// eslint-disable-next-line no-bitwise
		await access(config.paths.prefix, F_OK | R_OK | W_OK)
	} catch {
		log.error('Unable to access the prefix: %s', config.paths.prefix)
		status = false

		if (fix) {
			await sudo('doctor').catch(() => {
				log.blank()
				log.error('Unable to acquire privileges to fix the prefix')
				log.info('Try running %s again to resolve this.', ''.bold(`${config.bin_entry}`))

				exit(exit_code.error)
			})
		}
	}

	perf.end('preflight')
	return status
}
