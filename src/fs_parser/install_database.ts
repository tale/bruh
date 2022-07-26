import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { Transform } from 'node:stream'
import { BruhFormula } from 'types'
import { config } from 'utils'

export async function is_installed(formula: BruhFormula) {
	const reader = createReadStream(config.paths.install)
	const streamer = createInterface(reader)

	return new Promise<boolean>((resolve, reject) => {
		streamer.on('line', (line: string) => {
			const package_prefix = `##bruh_start_def## - ${JSON.stringify(formula)}`

			if (!line.startsWith(package_prefix)) {
				return
			}

			resolve(true)
		})
			.on('close', () => {
				resolve(false)
			})
			.on('SIGINT', reject)

		reader.on('error', reject)
	})
}

export async function flush_formula(formula: BruhFormula, files: string[]) {
	const writer = createWriteStream(config.paths.install, { flags: 'a' })

	writer.write(`##bruh_start_def## - ${JSON.stringify(formula)}\n`)

	for (const [index, path] of files.entries()) {
		writer.write(`${path}`)
		if (index < files.length - 1) {
			writer.write(',')
		}
	}

	writer.write('\n##bruh_end_def##\n')
	writer.end()

	return new Promise<void>((resolve, reject) => {
		writer.on('error', reject)
		writer.on('finish', () => {
			resolve()
		})
	})
}

export async function purge_formula(formula: BruhFormula) {
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

				if (line_contents === `##bruh_start_def## - ${JSON.stringify(formula)}\n`) {
					found_formula = true
					continue
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