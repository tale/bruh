import { log } from 'interface'
import { type bruh_formula } from 'types'

export function build_iterator(formula_count: number, type: 'download' | 'link') {
	let count_to = 0

	const callable_function = (formula: bruh_formula) => {
		count_to++

		if (type === 'download') {
			log.special.download(formula, count_to, formula_count)
		}

		if (type === 'link') {
			log.special.link(formula, count_to, formula_count)
		}
	}

	return callable_function
}
