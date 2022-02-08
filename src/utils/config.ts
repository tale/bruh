import { mkdir } from 'node:fs/promises'

export const config = {
	debug: process.env.DEBUG ? true : false,
	paths: {
		tiffyCache: '/opt/bruh/cache.d'
	},
	build: async () => {
		await mkdir('/opt/bruh')
	}
}
