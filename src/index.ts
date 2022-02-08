import { commands } from 'commands'
import { color } from 'interface'
import { log } from 'interface'
import { observeMetric } from 'utils'

// Initialize Color Support
color

observeMetric('argument-parse', async () => {
	// The first two args can always be ignored
	const args = process.argv.slice(2)
	const directive = args.shift()?.trim() ?? 'help'
	const command = commands.find(v => v.options.name === directive || v.options.aliases.includes(directive))
	if (!command) {
		log.error('Unknown Command: %s', directive)
		return
	}

	const flags = Object.fromEntries(command.options.flags.map(flag => {
		if (args.includes(flag.shortFlag) || args.includes(flag.longFlag)) {
			const index = args.findIndex(v => v === flag.shortFlag) ?? args.find(v => v === flag.longFlag)
			args.splice(index, 1)
			return [flag.name, true]
		}

		return [flag.name, false]
	}))

	log.debug('flags: %s', flags)
	log.debug('args: %s', args)
	await command.execute(flags, args)
})
