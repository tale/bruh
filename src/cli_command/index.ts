import { type command_type } from 'factory_builders'

import autoremove from './autoremove'
import doctor from './doctor'
import __global_flags from './global_flags'
import help from './help'
import install from './install'
import list from './list'
import uninstall from './uninstall'
import update from './update'

export const cli_commands = new Array<command_type>(
	__global_flags,
	install,
	update,
	help,
	list,
	uninstall,
	autoremove,
	doctor
)

export function find_command(name: string): command_type | undefined {
	return cli_commands.find(v => v.options.name === name)
}
