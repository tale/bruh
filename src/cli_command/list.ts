import { build_command } from 'factory_builders'
import { install_database } from 'fs_parser'
import { log } from 'interface'
import { exit_code } from 'utils'

export default build_command({
	name: 'list',
	usage: '[formula]',
	description: 'List all installed formulae or the files of a specific formula',
	flags: []
}, async (_flags, cli_arguments) => {
	if (cli_arguments.length === 0) {
		const installed = await install_database.get_installed()
		for (const formula of installed) {
			log.info(formula.name)
		}
	}

	const installed = [...await install_database.get_installed(true)]

	for await (const formula of cli_arguments) {
		const search = installed.find(f => f.name === formula)

		if (!search) {
			log.error('Formula %s is not installed', formula)
			continue
		}

		log.info('%s@%s', ''.bold(search.name), ''.dim(search.version))
		for (const file of search.files ?? []) {
			log.raw('  %s', file)
		}

		log.blank()
	}

	return exit_code.success
})