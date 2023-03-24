import { F_OK, R_OK, W_OK } from 'node:constants'
import { access, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { config, perf } from 'utils'

export async function preflight() {
	perf.start('preflight')

	try {
		// eslint-disable-next-line no-bitwise
		await access(config.paths.prefix, F_OK | R_OK | W_OK)
		await verify_signature()
	} catch (error) {
		console.log(error)
		await mkdir(config.paths.prefix, { recursive: true })
		await mkdir(config.paths.cache)
	}

	perf.end('preflight')
}

async function verify_signature() {
	// This join() makes pkg detect the file as a resource
	/* eslint-disable unicorn/prefer-module */
	const version_file = join(__dirname, 'bruh.ver')
	const signature_file = join(__dirname, 'bruh.sig')
	/* eslint-enable unicorn/prefer-module */

	const version_data = await readFile(version_file, 'utf8')
	const signature_data = await readFile(signature_file, 'utf8')

	console.log(version_data, signature_data)
}
