import { F_OK, R_OK } from 'node:constants'
import { createReadStream } from 'node:fs'
import { access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createGunzip } from 'node:zlib'
import { extract } from 'tar-fs'
import { bruh_formula } from 'types'
import { config } from 'utils'

export async function unpack(formula: bruh_formula) {
	const download_path = join(config.paths.cache, formula.blob)
	const link_path = join(config.paths.link, formula.name)

	const fs_checks = [
		// eslint-disable-next-line no-bitwise
		access(download_path, F_OK | R_OK),
		rm(link_path, { force: true, recursive: true })
	]

	await Promise.all(fs_checks)
	const stream = createReadStream(download_path)
		.pipe(createGunzip())
		.pipe(extract(config.paths.link))

	return new Promise<void>((resolve, reject) => {
		stream.on('finish', async () => {
			await rm(download_path, { force: true })
			resolve()
		})

		stream.on('error', reject)
	})
}
