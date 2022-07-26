import { BrewFormula, BruhFormula } from 'types'
import { config } from 'utils'

export async function fetch_formulas() {
	const headers = new Headers([
		['User-Agent', config.web.user_agent],
		['Accept', 'application/json']
	])

	const result = await fetch(config.web.brew.formulae, {
		method: 'GET',
		redirect: 'follow',
		headers
	})

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const data: BrewFormula[] = await result.json()
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

			const bruh_formula: BruhFormula = {
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

	return compatible_formulas as BruhFormula[]
}
