import { commands } from 'commands'
import { color } from 'interface'
import { log } from 'interface'
import { exit } from 'node:process'
import { endMetric, startMetric } from 'utils'

// Initialize Color Support
color

startMetric('argument-parse')

const args = process.argv.slice(2) // The first two args can always be ignored
const directive = args.shift()?.trim() ?? 'help'
const command = commands.find(v => v.options.name === directive)
if (!command) {
	log.error('Unknown Command: %s', directive)
	exit(1)
}

const flags = Object.fromEntries(command.options.flags.map(flag => {
	if (args.includes(flag.shortFlag) || args.includes(flag.longFlag)) {
		const index = args.findIndex(v => v === flag.shortFlag) ?? args.find(v => v === flag.longFlag)
		args.splice(index, 1)
		return [flag.name, true]
	}

	return [flag.name, false]
}))

endMetric('argument-parse')

// CommonJS doesn't allow top level await :(
const execute = async () => {
	startMetric('command-execute')
	log.debug('flags: %s', flags)
	log.debug('args: %s', args)

	await command.execute(flags, args)
	endMetric('command-execute')
}

execute()
