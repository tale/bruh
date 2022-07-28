import { command_type } from 'factory_builders'

import install from './install'
import update from './update'

export const cli_commands = new Array<command_type>(
	install,
	update
)
