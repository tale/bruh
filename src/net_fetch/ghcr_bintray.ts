import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { BruhFormula } from 'types'
import { config } from 'utils'

async function download_preflight(formula: BruhFormula) {
	try {
		const path = join(config.paths.cache, formula.blob)
		await rm(path, { force: true })
	} catch {
		throw new Error('Unable to remove previous cache file')
	}
}

export async function download(formula: BruhFormula) {
	await download_preflight(formula)

	const path = join(config.paths.cache, formula.blob)
	const writer = createWriteStream(path, 'binary')

	const headers = new Headers([
		['User-Agent', config.web.user_agent],
		['Accept', 'application/vnd.oci.image.index.v1+json'],
		['Authorization', 'Bearer QQ==']
	])

	// 120 second timeout using AbortController
	const abort_controller = new AbortController()
	const abort_timeout = setTimeout(() => {
		abort_controller.abort()
	}, 120 * 1000)

	const sub_path = `${formula.name.replace('@', '/')}/blobs/sha256:${formula.blob}`
	const result = await fetch(`${config.web.gh_bintray}/${sub_path}`, {
		signal: abort_controller.signal,
		method: 'GET',
		redirect: 'follow',
		headers
	})

	clearTimeout(abort_timeout)
	const reader = result.body?.getReader()
	let is_read = false

	if (!reader) {
		throw new Error('Missing response body stream')
	}

	while (!is_read) {
		// eslint-disable-next-line no-await-in-loop
		const { done, value } = await reader.read()

		if (done) {
			is_read = true
		} else {
			writer.write(value)
		}
	}

	writer.end()

	return new Promise((resolve, reject) => {
		writer.on('error', reject)
		writer.on('finish', resolve)
	})
}
