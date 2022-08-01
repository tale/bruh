import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { createBrotliCompress, createBrotliDecompress } from 'node:zlib'
import { bruh_formula } from 'types'
import { config } from 'utils'

function serialize(formula: bruh_formula) {
	return `${formula.name}|${formula.version}|${formula.revision}|${formula.blob}|${formula.dependencies.join(',')}\n`
}

export async function flush_database(formulas: bruh_formula[]) {
	const compress = createBrotliCompress()
	const write = createWriteStream(config.paths.tiffy)
	compress.pipe(write)

	for (const formula of formulas) {
		const cache = serialize(formula)
		compress.write(cache)
	}

	compress.end()

	return new Promise((resolve, reject) => {
		compress.on('error', reject)
		write.on('error', reject)
		write.on('finish', resolve)
	})
}

type deps = {
	resolved: bruh_formula[];
	unresolved: string[];
}

export async function resolve_deps(deps: string[]) {
	const decompressor = createBrotliDecompress()
	const reader = createReadStream(config.paths.tiffy)
	const streamer = createInterface(decompressor)

	const resolved_deps = new Array<bruh_formula>()
	reader.pipe(decompressor)

	return new Promise<deps>((resolve, reject) => {
		streamer.on('line', (line: string) => {
			for (const dep of deps) {
				// All caches start with the package name
				if (!line.startsWith(dep)) {
					continue
				}

				// This code deserializes the cache line and gets the dependency as an object
				const [name, version, revision, blob, dependencies] = line.split('|')
				const formula: bruh_formula = {
					name,
					version,
					revision: Number.parseInt(revision, 10),
					blob,
					dependencies: dependencies.split(',')
						.filter(Boolean)
				}

				if (deps.includes(formula.name)) {
					deps = deps.filter(to_keep => to_keep !== formula.name)
					resolved_deps.push(formula)
				}
			}
		})
			.on('close', () => {
				resolve({ resolved: resolved_deps, unresolved: deps })
			})
			.on('SIGINT', reject)

		decompressor.on('error', reject)
		reader.on('error', reject)
	})
}
