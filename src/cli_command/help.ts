import { cli_commands } from 'cli_command'
import { build_command } from 'factory_builders'
import { log } from 'interface'
import { config, exit_code } from 'utils'

export default build_command({
	name: 'help',
	usage: '[command]',
	description: 'Display help information',
	flags: []
// eslint-disable-next-line @typescript-eslint/require-await
}, async (_flags, cli_arguments) => {
	if (cli_arguments.length > 1) {
		log.error('Too many arguments supplied')
		log.error('Usage: %s %s', ''.bold(`${config.bin_entry} help`), ''.dim('[command]'))

		return exit_code.error
	}

	if (cli_arguments.length === 1) {
		const command = cli_commands.find(v => v.options.name === cli_arguments[0])

		if (!command) {
			log.error('Unknown command %s', ''.bold(cli_arguments[0]))
			return exit_code.error
		}

		const { options } = command

		log.raw('Usage: %s %s', ''.bold(`${config.bin_entry} ${options.name}`), ''.dim(options.usage))
		log.raw('Description: %s', ''.dim(options.description))
		log.raw('Flags:')

		for (const flag of options.flags) {
			log.raw('  %s %s %s', ''.bold(flag.short_flag), ''.bold(flag.long_flag), ''.dim(flag.description))
		}

		return exit_code.success
	}

	const { authority, description, version, author, bin_identity } = config.meta

	log.raw('%s: %s', ''.bold(config.bin_entry), ''.dim(description))
	log.raw('Version: %s %s', ''.bold(version), ''.dim(`(${bin_identity})`))
	log.raw('Author: %s %s', author, ''.dim(authority))

	log.blank()
	log.raw('Usage: %s %s', ''.bold(config.bin_entry), ''.dim('[command] [arguments]'))
	log.raw('Commands:')

	for (const command of cli_commands) {
		// Realistically a command shouldn't be longer than 16 characters so we can use that as an offset
		const spaces = ' '.repeat(16 - command.options.name.length)
		log.raw('  %s%s%s', ''.bold(command.options.name), spaces, ''.dim(command.options.description))
	}

	log.blank()
	log.raw('  See %s %s for detailed information', ''.bold(`${config.bin_entry} help`), ''.dim('[command]'))
})
