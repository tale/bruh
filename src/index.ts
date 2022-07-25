import { commands } from 'commands'
import { log } from 'interface'
import { exit } from 'node:process'
import { endMetric, preflight, startMetric } from 'utils'

// CommonJS doesn't allow top level await :(
const execute = async () => {
	startMetric('argument-parse')

	const arguments_ = process.argv.slice(2) // The first two args can always be ignored
	const directive = arguments_.shift()
		?.trim() ?? 'help'
	const command = commands.find(v => v.options.name === directive)
	if (!command) {
		log.error('Unknown Command: %s', directive)
		exit(1)
	}

	const flags = Object.fromEntries(command.options.flags.map(flag => {
		if (arguments_.includes(flag.shortFlag) || arguments_.includes(flag.longFlag)) {
			const index = arguments_.indexOf(flag.shortFlag) ?? arguments_.find(v => v === flag.longFlag)
			arguments_.splice(index, 1)
			return [flag.name, true]
		}

		return [flag.name, false]
	}))

	endMetric('argument-parse')
	await preflight()

	startMetric('command-execute')
	log.debug('flags: %s', flags)
	log.debug('args: %s', arguments_)

	await command.execute(flags, arguments_)
	endMetric('command-execute')
}

void execute()
