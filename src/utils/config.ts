import { log } from 'interface'
import { homedir, release } from 'node:os'
import { join } from 'node:path'
import { arch } from 'node:process'

const prefix = join(homedir(), 'Library', 'Application Support', 'Bruh')

function calculate_release_name() {
	// Non arm machines don't have architecture prefixes
	const arch_prefix = `${arch}_`.replace('x64_', '')
	let xnu_major_version = Number.parseInt(release()
		.split('.')[0], 10)

	const xnu_codenames = new Map<number, string>([
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

	if (supported_codenames.size === 0) {
		log.error('Your version of macOS is not supported.')
		log.error('XNU version: %s', release())
	}

	return supported_codenames
}

export const config = {
	debug: Boolean(process.env.DEBUG),
	xnu_codenames: calculate_release_name(),
	paths: {
		prefix,
		tiffy: join(prefix, 'tiffy.db'),
		cache: join(prefix, 'cache.d'),
		install: join(prefix, 'install.db')
	},
	web: {
		user_agent: 'Bruh/1.0 (+https://tale.me/go/bruh)', // TODO: Automated Version via tsup build time variables
		gh_bintray: 'https://ghcr.io/v2/homebrew/core',
		brew_formulas: 'https://formulae.brew.sh/api/formula.json'
	}
}
