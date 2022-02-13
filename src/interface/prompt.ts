import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline'

export class Prompt {
	static confirm(question: string) {
		const prefix = ''.dim('[').cyan('?').dim(']')
		const suffix = ''.dim('(Y/n)')

		// Add an extra space for the user input to look good
		const message = `${prefix} ${question} ${suffix} `
		const readline = createInterface({
			input: stdin,
			output: stdout
		})

		// We should never need to reject here
		return new Promise<boolean>(resolve => {
			readline.question(message, (raw) => {
				const response = raw.trim().toLowerCase()
				readline.close()

				if (response.length === 0 || response === 'y') {
					resolve(true)
				}

				resolve(false)
			})
		})
	}
}
