import { config } from 'utils'

export const log = {
	debug: (format: string, ...arguments_: unknown[]) => {
		if (config.debug) {
			const prefix = ''.dim('[')
				.magenta('%')
				.dim(']')
			console.log(`${prefix} ${format}`, ...arguments_)
		}
	},

	info: (format: string, ...arguments_: unknown[]) => {
		const prefix = ''.dim('[')
			.blue('i')
			.dim(']')
		console.log(`${prefix} ${format}`, ...arguments_)
	},

	error: (format: string, ...arguments_: unknown[]) => {
		const prefix = ''.dim('[')
			.red('x')
			.dim(']')
		console.log(`${prefix} ${format}`, ...arguments_)
	},

	warning: (format: string, ...arguments_: unknown[]) => {
		const prefix = ''.dim('[')
			.yellow('!')
			.dim(']')
		console.log(`${prefix} ${format}`, ...arguments_)
	},

	blank: () => {
		console.log('')
	},

	special: {
		update: (source: string) => {
			const prefix = ''.dim('[')
				.green('>')
				.dim(']')
			console.log(`${prefix} Updating %s`, source)
		}
	}
}
