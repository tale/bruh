import { mkdir } from 'node:fs/promises'

export const config = {
	paths: {
		tiffyCache: '/opt/bruh/cache.d'
	},
	build: async () => {
		await mkdir('/opt/bruh')
	}
}
