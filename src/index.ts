import { exit } from 'node:process'

import { find_command } from 'cli_command'
import { log } from 'interface'
import { config, perf, preflight } from 'utils'

// This cannot be an ESM style import for some reason
process.removeAllListeners('warning')

// CommonJS doesn't allow top level await :(
const execute = async () => {
	perf.start('argument-parse')

	// The first two args can always be ignored
	const runtime_arguments = process.argv.slice(2)
	const raw_argument = runtime_arguments.shift()
		?.trim()

	const directive = raw_argument?.startsWith('-') ? '__global_flags' : raw_argument ?? '__global_flags'
	const command = find_command(directive)
	if (!command) {
		log.error('Unknown Command: %s', directive)
		exit(1)
	}

	const flags = Object.fromEntries(command.options.flags.map(flag => {
		if (runtime_arguments.includes(flag.short_flag) || runtime_arguments.includes(flag.long_flag)) {
			const index = runtime_arguments.indexOf(flag.short_flag) ?? runtime_arguments.find(v => v === flag.long_flag)
			runtime_arguments.splice(index, 1)
			return [flag.name, true]
		}

		return [flag.name, false]
	}))

	perf.end('argument-parse')
	await preflight()

	perf.start('command-execute')
	log.debug('flags: %s', flags)
	log.debug('args: %s', runtime_arguments)

	let exit_code = 0

	try {
		exit_code = await command.run(flags, runtime_arguments) ?? 0
	} catch (error: unknown) {
		log.error('An error has occurred while running this command')
		log.error('Please report this at %s', ''.dim(config.meta.gh))

		if (error instanceof Error) {
			log.debug('error: %s - %s', error.name, ''.dim(error.message))

			const error_trace = error.stack?.replaceAll(`${error.name}: ${error.message}\n`, '')
			log.debug('stack: %s', ''.dim(error_trace?.trim() ?? 'No stacktrace available'))
		} else {
			log.debug('error: %s', error)
		}
	} finally {
		perf.end('command-execute')
		perf.dump()
		exit(exit_code)
	}
}

void execute()
