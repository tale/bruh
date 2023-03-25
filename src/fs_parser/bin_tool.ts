import { F_OK, R_OK } from 'node:constants'
import { createReadStream } from 'node:fs'
import { access, readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createGunzip } from 'node:zlib'

import { extract } from 'tar-fs'
import { type bruh_formula } from 'types'
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

export async function link(formula: bruh_formula) {
	const linkable_directories = new Set([
		'bin',
		'etc',
		'Frameworks',
		'include',
		'lib',
		'opt',
		'sbin',
		'share',
		'var'
	])

	const unpacked_version = formula.version + (formula.revision > 0 ? `_${formula.revision}` : '')
	const directory = join(config.paths.link, formula.name, unpacked_version)

	const file_entries = await readdir(directory, { withFileTypes: true })
	const recursed_file_paths = file_entries.map(async entry => {
		// We need to check if the entry includes / otherwise files in the root of the tarball will be skipped
		if (!entry.isDirectory() || (entry.name.includes('/') && !linkable_directories.has(entry.name))) {
			return []
		}

		const paths = await recurse_link(entry.name, directory, formula)
		return paths
	})

	const paths = await Promise.all(recursed_file_paths)
	return paths.flat()
}

async function recurse_link(file: string, path: string, formula: bruh_formula) {
	const file_entries = await readdir(join(path, file), { withFileTypes: true, encoding: 'utf8' })
	const paths = new Array<string>()

	const operations = file_entries.map(async entry => {
		if (entry.isSymbolicLink()) {
			return
		}

		if (entry.isDirectory()) {
			const paths = await recurse_link(entry.name, join(path, file), formula)
			return paths
		}

		const from_path = join(path, file, entry.name)
		// Const to_path = join()

		// // TODO: Don't just rm the path, warn and require --force-link as a CLI flag
		// await rm(toPath, { force: true, recursive: true })
		// await mkdir(join(Config.prefix(), file), { recursive: true })
		// await symlink(fromPath, toPath)
		// await MachO.rewritePaths(toPath, formula)

		// await mach_o.extract_mach_o(from_path)
		paths.push(resolve(from_path)) // TODO: Make this to_path
	})

	const recursed_paths = await Promise.all(operations)
	const non_null_recursed_paths = recursed_paths.filter(Boolean) as string[][]
	paths.push(...non_null_recursed_paths.flat())

	return paths
}
