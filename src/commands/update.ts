import { Command } from '../classes'

interface Flags {
	test: boolean
}

export default new Command<Flags>({
	name: 'update',
	aliases: [],
	flags: [
		{
			name: 'test',
			longFlag: '--test-flag',
			shortFlag: '-t'
		}
	]
}, async (flags, args) => {
	// Do update
})
