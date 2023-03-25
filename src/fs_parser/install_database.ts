import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { Transform } from 'node:stream'

import { type bruh_formula } from 'types'
import { config } from 'utils'

export async function is_installed(formulas: bruh_formula[]) {
	if (!existsSync(config.paths.install)) {
		return new WeakMap<bruh_formula, boolean>(formulas.map(formula => [formula, false]))
	}

	const reader = createReadStream(config.paths.install)
	const streamer = createInterface(reader)
	const formula_map = new WeakMap<bruh_formula, boolean>()

	return new Promise<WeakMap<bruh_formula, boolean>>((resolve, reject) => {
		streamer.on('line', (line: string) => {
			for (const formula of formulas) {
				const package_prefix = `##bruh_start_def## - ${JSON.stringify(formula)}`
				if (line.startsWith(package_prefix)) {
					formula_map.set(formula, true)
					break
				}

				formula_map.set(formula, false)
			}
		})
			.on('close', () => {
				resolve(formula_map)
			})
			.on('SIGINT', reject)

		reader.on('error', reject)
	})
}

type bruh_formula_local = bruh_formula & {
	files?: string[];
}

export async function get_installed(pull_files = false) {
	const reader = createReadStream(config.paths.install)
	const streamer = createInterface(reader)
	const formulas = new Set<bruh_formula_local>()

	return new Promise<Set<bruh_formula_local>>((resolve, reject) => {
		let current_formula: bruh_formula | undefined
		let current_files = new Array<string>()

		streamer.on('line', (line: string) => {
			if (line.startsWith('##bruh_start_def##')) {
				const formula = JSON.parse(line.split(' - ')[1]) as bruh_formula
				current_formula = formula
			}

			// The rest of the code paths are for getting files
			// This is only done when the formula_name is supplied
			if (!pull_files) {
				if (current_formula) {
					formulas.add(current_formula)
				}

				return
			}

			if (line.startsWith('##bruh_end_def##')) {
				if (!current_formula) {
					return
				}

				formulas.add({
					...current_formula,
					files: current_files
				})

				current_formula = undefined
				current_files = new Array<string>()
			}

			if (current_formula) {
				current_files = line.split(',')
			}
		})
			.on('close', () => {
				resolve(formulas)
			})
			.on('SIGINT', reject)

		reader.on('error', reject)
	})
}

export async function flush_formulas(map: Map<bruh_formula, string[]>) {
	const writer = createWriteStream(config.paths.install, { flags: 'a' })

	for (const [formula, files] of map) {
		writer.write(`##bruh_start_def## - ${JSON.stringify(formula)}\n`)

		for (const [index, path] of files.entries()) {
			writer.write(`${path}`)
			if (index < files.length - 1) {
				writer.write(',')
			}
		}

		writer.write('\n##bruh_end_def##\n')
	}

	writer.end()
	return new Promise<void>((resolve, reject) => {
		writer.on('error', reject)
		writer.on('finish', () => {
			resolve()
		})
	})
}

export async function purge_formulas(formulas: bruh_formula[]) {
	const reader = createReadStream(config.paths.install)
	const writer = createWriteStream(config.paths.install)

	let transform_data = Buffer.alloc(0)
	let found_formula = false

	const purge_transform = new Transform({
		transform(chunk: Buffer, encoding, callback) {
			const data = Buffer.from(chunk)
			transform_data = Buffer.concat([transform_data, data])

			let newline_index = transform_data.indexOf('\n')

			while ((newline_index = transform_data.indexOf('\n', newline_index + 1)) !== -1) {
				const line_data = transform_data.subarray(0, ++newline_index)
				transform_data = transform_data.subarray(newline_index)

				const line_contents = line_data.toString()
				if (found_formula) {
					continue
				}

				for (const formula of formulas) {
					if (line_contents === `##bruh_start_def## - ${JSON.stringify(formula)}\n`) {
						found_formula = true
						continue
					}
				}

				if (line_contents === '##bruh_end_def##\n') {
					found_formula = false
					continue
				}

				this.push(line_data)
			}

			callback()
		}
	})

	reader.pipe(purge_transform)
		.pipe(writer)

	return new Promise((resolve, reject) => {
		reader.on('error', reject)
		purge_transform.on('error', reject)
		writer.on('error', reject)
		writer.on('finish', resolve)
	})
}
