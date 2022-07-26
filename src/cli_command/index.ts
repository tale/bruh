import { Command } from 'classes/command'

import install from './install'
import update from './update'

export const cli_commands = new Array<Command>(
	install,
	update
)
