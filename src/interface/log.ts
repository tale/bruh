import { DEBUG_MODE } from '../constants'

export const log = {
	debug: (format: string, ...args: unknown[]) => {
		if (DEBUG_MODE) {
			const prefix = ''.dim('[').magenta('%').dim(']')
			console.log(`${prefix} ${format}`, ...args)
		}
	},

	info: (format: string, ...args: unknown[]) => {
		const prefix = ''.dim('[').blue('i').dim(']')
		console.log(`${prefix} ${format}`, ...args)
	},

	error: (format: string, ...args: unknown[]) => {
		const prefix = ''.dim('[').red('x').dim(']')
		console.log(`${prefix} ${format}`, ...args)
	}
}
