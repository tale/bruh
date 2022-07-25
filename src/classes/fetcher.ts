import axios from 'axios'
import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import { release } from 'node:os'
import { join } from 'node:path'
import { arch } from 'node:process'
import { Readable } from 'node:stream'
import { BrewFormula, BruhFormula } from 'types'
import { config } from 'utils/config'

class GHCR {
	private readonly http = axios.create({
		baseURL: 'https://ghcr.io/v2/homebrew/core/',
		responseType: 'stream',
		timeout: 1000 * 120, // 120 Seconds
		headers: {
			Accept: 'application/vnd.oci.image.index.v1+json',
			Authorization: 'Bearer QQ==',
			'User-Agent': 'Bruh 1.0'
		}
	})

	async download({ name, blob, version }: BruhFormula) {
		await rm(join(config.paths.tiffy, `${name}_${version}.bottle.tar.gz`), { force: true })

		return new Promise(async (resolve, reject) => {
			try {
				const { data } = await this.http.get<Readable>(`/${name.replace('@', '/')}/blobs/sha256:${blob}`)
				const writeStream = createWriteStream(join(config.paths.tiffy, `${name}_${version}.bottle.tar.gz`), 'binary')
				data.pipe(writeStream)

				writeStream.on('finish', resolve)
				writeStream.on('error', reject)
				data.on('error', reject)
			} catch (error: any) {
				console.error(error.message, name)
			}
		})
	}
}

class API {
	private readonly prefix = (function () {
		const prefix = arch.replace('x64_', '') // Only arm64 is prefixed
		const version = Number.parseInt(release()
			.split('.')[0]) // Major XNU Version only

		const map = new Map([
			[21, 'big_sur'], // TODO: Handle older releases
			[20, 'big_sur']
		])

		return map.get(version) ?? 'unknown' // TODO: Error handling
	})()

	private readonly http = axios.create({
		baseURL: 'https://formulae.brew.sh/api',
		timeout: 1000 * 3, // 3 Seconds
		headers: {
			Accept: 'application/json',
			'User-Agent': 'Bruh 1.0'
		}
	})

	async allFormulae() {
		const { data } = await this.http.get<BrewFormula[]>('/formula.json')
		const compatible = data.filter(package_ => package_.bottle.stable?.files[this.prefix] || package_.bottle.stable?.files.all)

		// Only map and return the values we need. Less data parsing
		return compatible.map(package_ => {
			return {
				tap: 'homebrew/core',
				name: package_.name,
				revision: Number.parseInt(package_.revision),
				version: package_.versions.stable,
				blob: package_.bottle.stable?.files[this.prefix]?.sha256 ?? package_.bottle.stable!.files.all?.sha256,
				dependencies: package_.dependencies
			} as BruhFormula
		})
	}
}

export const Fetcher = {
	API: new API(),
	GHCR: new GHCR()
}
