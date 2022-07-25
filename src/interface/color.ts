/* eslint-disable @typescript-eslint/restrict-template-expressions */
// eslint-disable-next-line no-extend-native
Object.defineProperties(String.prototype, {
	bold: {
		value(text: string): string {
			return `${this ?? ''}\u001B[1m${text}\u001B[0m`
		}
	},
	dim: {
		value(text: string): string {
			return `${this ?? ''}\u001B[2m${text}\u001B[0m`
		}
	},
	black: {
		value(text: string): string {
			return `${this ?? ''}\u001B[30m${text}\u001B[0m`
		}
	},
	red: {
		value(text: string): string {
			return `${this ?? ''}\u001B[31m${text}\u001B[0m`
		}
	},
	green: {
		value(text: string): string {
			return `${this ?? ''}\u001B[32m${text}\u001B[0m`
		}
	},
	yellow: {
		value(text: string): string {
			return `${this ?? ''}\u001B[33m${text}\u001B[0m`
		}
	},
	blue: {
		value(text: string): string {
			return `${this ?? ''}\u001B[34m${text}\u001B[0m`
		}
	},
	magenta: {
		value(text: string): string {
			return `${this ?? ''}\u001B[35m${text}\u001B[0m`
		}
	},
	cyan: {
		value(text: string): string {
			return `${this ?? ''}\u001B[36m${text}\u001B[0m`
		}
	},
	white: {
		value(text: string): string {
			return `${this ?? ''}\u001B[37m${text}\u001B[0m`
		}
	}
})
export {} // Exporting a fake module allows us to declare global

declare global {
	interface String {
		bold(text: string): string;
		dim(text: string): string;
		black(text: string): string;
		red(text: string): string;
		green(text: string): string;
		yellow(text: string): string;
		blue(text: string): string;
		magenta(text: string): string;
		cyan(text: string): string;
		white(text: string): string;
	}
}
