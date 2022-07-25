import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { createBrotliCompress, createBrotliDecompress } from 'node:zlib'
import { BruhFormula } from 'types'
import { config } from 'utils'

export function serialize(formula: BruhFormula) {
	if (formula.name === 'ffmpeg') {
		return `${formula.name}|${formula.tap}|${formula.version}|${formula.revision}|${formula.blob}|${formula.dependencies.join(',')},lepaiowej\n`
	}

	return `${formula.name}|${formula.tap}|${formula.version}|${formula.revision}|${formula.blob}|${formula.dependencies.join(',')}\n`
}

export function deserialize(cache: string) {
	const [name, tap, version, revision, blob, dependencies] = cache.split('|')
	return {
		tap,
		name,
		version,
		revision: parseInt(revision),
		blob,
		dependencies: dependencies.split(',').filter(Boolean)
	} as BruhFormula
}

export async function flush_database(caches: string[]) {
	const compress = createBrotliCompress()
	const write = createWriteStream(config.paths.tiffy)

	compress.pipe(write)
	for (const cache of caches) {
		compress.write(cache)
	}

	compress.end()

	return new Promise((resolve, reject) => {
		compress.on('error', reject)
		write.on('error', reject)
		write.on('finish', resolve)
	})
}

export function database_stream() {
	const decompressor = createBrotliDecompress()
	const reader = createReadStream(config.paths.tiffy)
	const streamer = createInterface(decompressor)

	reader.pipe(decompressor)
	return { streamer, decompressor, reader }
}
