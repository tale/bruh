export const log = {
	debug: (format: string, ...args: unknown[]) => {
		const prefix = ''.dim('[').magenta('%').dim(']')
		console.log(`${prefix} ${format}`, ...args)
	}
}
