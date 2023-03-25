import { constants, createReadStream, createWriteStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { createInterface } from 'node:readline'

import { type bruh_formula_state } from 'types'
import { config } from 'utils'

export async function get_installed(): Promise<bruh_formula_state[]> {
	try {
		// eslint-disable-next-line no-bitwise
		await access(config.paths.install, constants.F_OK | constants.R_OK)
	} catch {
		return []
	}

	const reader = createReadStream(config.paths.install)
	const streamer = createInterface(reader)
	const formulas = new Array<bruh_formula_state>()

	for await (const line of streamer) {
		const formula = JSON.parse(line.slice(Math.max(0, line.indexOf('}') + 1))) as bruh_formula_state
		formulas.push(formula)
	}

	return formulas
}

export async function mark_as_installed(...formulas: bruh_formula_state[]): Promise<void> {
	const writer = createWriteStream(config.paths.install, { flags: 'a+' })

	for (const formula of formulas) {
		const line = JSON.stringify(formula)
			.replace('\n', '\\n')
			.replace('\r', '\\r')

		writer.write(`bruh_def{${formula.name}}${line}\n`)
	}

	writer.end()
	return new Promise<void>((resolve, reject) => {
		writer.on('error', reject)
		writer.on('finish', () => {
			resolve()
		})
	})
}

export async function mark_as_uninstalled(...formula_names: string[]): Promise<bruh_formula_state[]> {
	const return_formulas = new Array<bruh_formula_state>()
	const reader = createReadStream(config.paths.install)

	// Create an in-memory buffer (string is faster) to write the updated file to
	// This gets flushed to disk at the end of all the operations
	let buffer = ''
	const streamer = createInterface({ input: reader })

	for await (const line of streamer) {
		// This is something that we're uninstalling it so skip writing it to our buffer
		if (formula_names.some(name => line.startsWith(`bruh_def{${name}}`))) {
			const formula = JSON.parse(line.slice(Math.max(0, line.indexOf('}') + 1))) as bruh_formula_state
			return_formulas.push(formula)
			continue
		}

		buffer += `${line}\n`
	}

	const file_writer = createWriteStream(config.paths.install)
	file_writer.write(buffer)
	file_writer.end()

	return new Promise<bruh_formula_state[]>((resolve, reject) => {
		file_writer.on('error', reject)
		file_writer.on('finish', () => {
			resolve(return_formulas)
		})
	})
}

