import axios from 'axios'
import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { BruhFormula } from 'types'
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

export const Fetcher = {
	GHCR: new GHCR()
}
