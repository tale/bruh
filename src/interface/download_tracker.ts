import { log } from 'interface'
import { bruh_formula } from 'types'

export function build_iterator(formula_count: number) {
	let count_to = 0

	const callable_function = (formula: bruh_formula) => {
		count_to++
		log.special.download(formula, count_to, formula_count)
	}

	return callable_function
}
