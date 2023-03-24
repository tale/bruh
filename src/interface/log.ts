import { type bruh_formula } from 'types'
import { config } from 'utils'

export const log = {
	debug: (format: string, ...log_arguments: unknown[]) => {
		if (config.debug) {
			const prefix = ''.dim('[')
				.magenta('%')
				.dim(']')
			console.log(`${prefix} ${format}`, ...log_arguments)
		}
	},

	info: (format: string, ...log_arguments: unknown[]) => {
		const prefix = ''.dim('[')
			.blue('i')
			.dim(']')
		console.log(`${prefix} ${format}`, ...log_arguments)
	},

	error: (format: string, ...log_arguments: unknown[]) => {
		const prefix = ''.dim('[')
			.red('x')
			.dim(']')
		console.log(`${prefix} ${format}`, ...log_arguments)
	},

	warning: (format: string, ...log_arguments: unknown[]) => {
		const prefix = ''.dim('[')
			.yellow('!')
			.dim(']')
		console.log(`${prefix} ${format}`, ...log_arguments)
	},

	raw: (format: string, ...log_arguments: unknown[]) => {
		console.log(format, ...log_arguments)
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
		},
		link: (formula: bruh_formula, count_to: number, formula_count: number) => {
			const prefix = ''.dim('[')
				.green('>')
				.dim(']')

			const count = ''.dim(`${count_to}/${formula_count}`)

			console.log(`${prefix} ${count} Linking %s %s`, ''.bold(formula.name), ''.cyan(formula.version))
		},
		download: (formula: bruh_formula, count_to: number, formula_count: number) => {
			const prefix = ''.dim('[')
				.green('>')
				.dim(']')

			const count = ''.dim(`${count_to}/${formula_count}`)

			console.log(`${prefix} ${count} Downloading %s %s %s`, ''.bold(formula.name), ''.cyan(formula.version), ''.dim(formula.blob))
		}
	}
}
