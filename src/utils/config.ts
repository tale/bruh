import { accessSync, constants, readFileSync } from 'node:fs'
import { homedir, release } from 'node:os'
import { join } from 'node:path'
import { arch, argv0 } from 'node:process'

import { log } from 'interface'
import { parse } from 'plist'
import { type system_plist } from 'types'

// Load our build time globals
declare global {
	const build_constants: {
		commit_hash: string;
		version: string;
		build_time: string;
		bin_identity: string;
		authority: string;
		config: {
			author_name: string;
			github_url: string;
			support_email: string;
			user_agent: string;
			description: string;
		};
	}
}

const prefix = join('/opt', 'bruh')

function get_macos_meta() {
	try {
		// This file always exists on the system at the current version of macOS
		accessSync('/System/Library/CoreServices/SystemVersion.plist', constants.R_OK)
		const xml = readFileSync('/System/Library/CoreServices/SystemVersion.plist', 'utf8')

		const parsed = parse(xml) as system_plist
		return {
			name: parsed.ProductName,
			version: parsed.ProductUserVisibleVersion,
			copyright: parsed.ProductCopyright
		}
	} catch {
		return {
			name: 'Unknown',
			version: '-1.0.0',
			copyright: 'Apple Inc.'
		}
	}
}

function get_release_info() {
	// Non arm machines don't have architecture prefixes
	const arch_prefix = `${arch}_`.replace('x64_', '')
	let xnu_major_version = Number.parseInt(release()
		.split('.')[0], 10)

	const xnu_codenames = new Map<number, string>([
		[23, `${arch_prefix}sonoma`],
		[22, `${arch_prefix}ventura`],
		[21, `${arch_prefix}monterey`],
		[20, `${arch_prefix}big_sur`]
	])

	const supported_codenames = new Set<string>()
	while (xnu_codenames.has(xnu_major_version)) {
		const xnu_version = xnu_codenames.get(xnu_major_version)
		if (!xnu_version) {
			continue
		}

		supported_codenames.add(xnu_version)
		xnu_major_version--
	}

	const macos_meta = get_macos_meta()
	if (supported_codenames.size === 0) {
		log.warning('%s %s is currently not supported by %s', macos_meta.name, macos_meta.version, ''.bold('bruh'))
		log.warning(''.dim('Please open an issue on GitHub if you encounter errors'))
		log.warning(''.dim(build_constants.config.github_url))
	}

	return {
		supported_codenames,
		macos_meta
	}
}

const info = get_release_info()
export const config = {
	debug: Boolean(process.env.DEBUG),
	bin_entry: argv0,
	xnu_codenames: info.supported_codenames,
	macos_meta: info.macos_meta,
	paths: {
		prefix,
		tiffy: join(prefix, 'tiffy.db'),
		cache: join(prefix, 'cache.d'),
		link: join(prefix, 'link.d'),
		install: join(prefix, 'install.db')
	},
	web: {
		user_agent: build_constants.config.user_agent,
		gh_bintray: 'https://ghcr.io/v2/homebrew/core',
		brew_formulas: 'https://formulae.brew.sh/api/formula.json'
	},
	meta: {
		gh: build_constants.config.github_url,
		author: build_constants.config.author_name,
		email: build_constants.config.support_email,
		description: build_constants.config.description,
		version: build_constants.version,
		build_time: build_constants.build_time,
		commit_hash: build_constants.commit_hash,
		bin_identity: build_constants.bin_identity,
		authority: build_constants.authority
	}
}
