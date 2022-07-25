import { homedir } from 'node:os'
import { join } from 'node:path'

const prefix = join(homedir(), 'Library', 'Application Support', 'Bruh')

export const config = {
	debug: Boolean(process.env.DEBUG),
	paths: {
		prefix,
		tiffy: join(prefix, 'tiffy.db'),
		cache: join(prefix, 'cache.d'),
		installed: join(prefix, 'install.d')
	}
}
