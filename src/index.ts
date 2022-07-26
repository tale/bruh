import { commands } from 'commands'
import { log } from 'interface'
import { exit } from 'node:process'
import { perf, preflight } from 'utils'

// CommonJS doesn't allow top level await :(
const execute = async () => {
	perf.start('argument-parse')

	// The first two args can always be ignored
	const runtime_arguments = process.argv.slice(2)
	const directive = runtime_arguments.shift()
		?.trim() ?? 'help' // Default to help command if no directive is given

	const command = commands.find(v => v.options.name === directive)
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

	let exitCode = 0

	try {
		await command.run(flags, runtime_arguments)
	} catch (error: unknown) {
		if (typeof error === 'number') {
			exitCode = error
		} else {
			console.log(error)
		}
	} finally {
		perf.end('command-execute')
		perf.dump()
		exit(exitCode)
	}
}

void execute()
