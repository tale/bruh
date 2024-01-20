import { find_command } from 'cli_command'
import { build_command } from 'factory_builders'
import { log } from 'interface'
import { config, exit_code } from 'utils'

export default build_command<{
	help: boolean;
	version: boolean;
	cache: boolean;
}>({
	name: '__global_flags',
	usage: '',
	description: '',
	flags: [
		{
			name: 'help',
			description: 'Display help information',
			short_flag: '-h',
			long_flag: '--help'
		},
		{
			name: 'version',
			description: 'Display version information',
			short_flag: '-v',
			long_flag: '--version'
		},
		{
			name: 'cache',
			description: 'Display bruh\'s download cache. (Does not fully implement brew --cache)',
			long_flag: '--cache'
		}
	]
}, async (flags, cli_arguments) => {
	if (flags.version) {
		const { version, bin_identity, gh } = config.meta
		log.raw('%s — %s', ''.bold('bruh'), ''.bold(version))
		log.raw('%s', ''.dim(bin_identity))
		log.raw('%s', ''.dim(gh))
		return exit_code.success
	}

	if (flags.cache) {
		log.raw(config.paths.cache)
		return exit_code.success
	}

	// Flags.help can be ignored as it's handled by the default command
	const help = find_command('help')
	return help?.run(flags, cli_arguments)
})

