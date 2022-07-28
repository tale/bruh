import { brew_formula, bruh_formula } from 'types'
import { config } from 'utils'

export async function fetch_formulas() {
	const headers = new Headers([
		['User-Agent', config.web.user_agent],
		['Accept', 'application/json']
	])

	// 5 second timeout using AbortController
	const abort_controller = new AbortController()
	const abort_timeout = setTimeout(() => {
		abort_controller.abort()
	}, 5 * 1000)

	const result = await fetch(config.web.brew_formulas, {
		signal: abort_controller.signal,
		method: 'GET',
		redirect: 'follow',
		headers
	})

	clearTimeout(abort_timeout)

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const data: brew_formula[] = await result.json()
	const compatible_formulas = data
		.filter(formula => {
			if (formula.bottle.stable?.files.all) {
				return true
			}

			for (const code_name of config.xnu_codenames) {
				if (formula.bottle.stable?.files[code_name]) {
					return true
				}
			}

			return false
		})
		.map(formula => {
			let blob_url = formula.bottle.stable?.files.all

			if (!blob_url) {
				// Calculate the version independent path in the JSON
				for (const code_name of config.xnu_codenames) {
					if (formula.bottle.stable?.files[code_name]) {
						blob_url = formula.bottle.stable?.files[code_name]
						break
					}
				}
			}

			if (!blob_url) {
				return
			}

			const bruh_formula: bruh_formula = {
				tap: 'homebrew/core',
				name: formula.name,
				version: formula.versions.stable,
				revision: Number.parseInt(formula.revision, 10),
				blob: blob_url?.sha256,
				dependencies: formula.dependencies

			}

			return bruh_formula
		})
		.filter(Boolean)

	return compatible_formulas as bruh_formula[]
}
