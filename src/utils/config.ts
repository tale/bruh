import { mkdir } from 'node:fs/promises'

export const config = {
	debug: process.env.DEBUG ? true : false,
	paths: {
		tiffy: '/opt/bruh/tiffy.d',
		cache: '/opt/bruh/cache.d',
		installed: '/opt/bruh/install.d'
	},
	build: async () => {
		await mkdir('/opt/bruh')
	}
}
