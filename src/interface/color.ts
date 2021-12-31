Object.defineProperties(String.prototype, {
	bold: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[1m${text}\x1b[0m`
		},
	},
	dim: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[2m${text}\x1b[0m`
		},
	},
	black: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[30m${text}\x1b[0m`
		},
	},
	red: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[31m${text}\x1b[0m`
		},
	},
	green: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[32m${text}\x1b[0m`
		},
	},
	yellow: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[33m${text}\x1b[0m`
		},
	},
	blue: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[34m${text}\x1b[0m`
		},
	},
	magenta: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[35m${text}\x1b[0m`
		},
	},
	cyan: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[36m${text}\x1b[0m`
		},
	},
	white: {
		value: function (text: string): string {
			return `${this ?? ''}\x1b[37m${text}\x1b[0m`
		},
	}
})
export {} // Exporting a fake module allows us to declare global

declare global {
	interface String {
		bold(text: string): string
		dim(text: string): string
		black(text: string): string
		red(text: string): string
		green(text: string): string
		yellow(text: string): string
		blue(text: string): string
		magenta(text: string): string
		cyan(text: string): string
		white(text: string): string
	}
}
