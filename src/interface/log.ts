import { config } from 'utils'

export const log = {
	debug: (format: string, ...args: unknown[]) => {
		if (config.debug) {
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
	},

	warning: (format: string, ...args: unknown[]) => {
		const prefix = ''.dim('[').yellow('!').dim(']')
		console.log(`${prefix} ${format}`, ...args)
	},

	special: {
		update: (source: string) => {
			const prefix = ''.dim('[').green('>').dim(']')
			console.log(`${prefix} Updating %s`, source)
		}
	}
}
