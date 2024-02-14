import { chmod, mkdir } from 'node:fs/promises'
import { geteuid } from 'node:process'

import { build_command } from 'factory_builders'
import { log } from 'interface'
import { config, exit_code, preflight } from 'utils'

const description = `Checks the system for common issues.
Note: If run as root, it will attempt to fix any file permission issues.`

export default build_command({
	name: 'doctor',
	usage: '',
	description,
	flags: []
}, async () => {
	const good = await preflight()

	// In sudo it should never print out anything
	if (!good && geteuid && geteuid() === 0) {
		try {
			await mkdir(config.paths.prefix, { recursive: true })
			await chmod(config.paths.prefix, 0o777)
			await mkdir(config.paths.cache)
		} catch {
			return exit_code.error
		}
	}

	if (!good) {
		log.error('Preflight checks failed')
		log.error('Failed to acquire permissions on %s', ''.bold(config.paths.prefix))
		log.error(''.dim('Failed R_OK | W_OK | F_OK on access()'))

		log.warning(''.dim('This is meant for developers to debug issues with bruh'))
		log.warning(''.dim('Please open an issue on GiHub if you encounter errors'))
		return exit_code.error
	}

	return exit_code.success
})
