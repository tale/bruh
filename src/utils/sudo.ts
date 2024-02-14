// This script essentially works to make osascript do the following:
// osascript -e "do shell script \"$*\" with administrator privileges"

import { exec } from 'node:child_process'
import { argv, geteuid } from 'node:process'

import { log } from 'interface'
import { config } from 'utils'

export async function sudo(command: string) {
	if (geteuid && geteuid() === 0) {
		return
	}

	log.info('Attempting to fix the issue with root privileges')
	log.info('If prompted by %s, please enter your password', ''.bold('osascript'))

	let entrypoint = config.bin_entry

	// Ran in development, args need to be different
	if (entrypoint.includes('node')) {
		// Find the entire command needed to execute the script
		// This is needed because the script is ran with ts-node
		for (const element of argv.slice(1)) {
			entrypoint += ` ${element}`
			if (element.endsWith('.js')) {
				break
			}
		}
	}

	const command_arguments = [
		'osascript -e',
		'\'do shell script',
		`"${entrypoint} ${command}"`,
		'with administrator privileges\''
	]

	log.debug('sudo command: %s', command_arguments.join(' '))

	return new Promise<void>((resolve, reject) => {
		exec(command_arguments.join(' '), error => {
			if (error) {
				reject(error)
				return
			}

			resolve()
		})
	})
}

