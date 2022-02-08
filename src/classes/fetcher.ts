import axios from 'axios'
import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import { release } from 'node:os'
import { join } from 'node:path'
import { arch } from 'node:process'
import { Readable } from 'node:stream'
import { config } from '../utils/config'

export type Formula = {
	name: string
	version: string
	blob: string
	dependencies: string[]
	revision: number
}

class GHCR {
	private http = axios.create({
		baseURL: 'https://ghcr.io/v2/homebrew/core/',
		responseType: 'stream',
		timeout: 1000 * 120, // 120 Seconds
		headers: {
			'Accept': 'application/vnd.oci.image.index.v1+json',
			'Authorization': 'Bearer QQ==',
			'User-Agent': 'Bruh 1.0'
		}
	})

	async download({ name, blob, version }: Formula) {
		await rm(join(config.paths.tiffyCache, `${name}_${version}.bottle.tar.gz`), { force: true })

		return await new Promise(async (resolve, reject) => {
			try {
				const { data } = await this.http.get<Readable>(`/${name.replace('@', '/')}/blobs/sha256:${blob}`)
				const writeStream = createWriteStream(join(config.paths.tiffyCache, `${name}_${version}.bottle.tar.gz`), 'binary')
				data.pipe(writeStream)

				writeStream.on('finish', resolve)
				writeStream.on('error', reject)
				data.on('error', reject)
			} catch (e: any) {
				console.error(e.message, name)
			}
		})
	}
}

export class Fetcher {
	private static prefix = function() {
		const prefix = arch.concat('_').replace('x64_', '') // Only arm64 is prefixed
		const version = parseInt(release().split('.')[0]) // Major XNU Version only

		const map = new Map([
			[21, prefix.concat('big_sur')], // TODO: Handle older releases
			[20, prefix.concat('big_sur')]
		])

		if (!map.has(version)) throw new Error('Unable to get version prefix.')
		return map.get(version)
	}()

	static API: {

	}

	static GHCR = new GHCR()
}
