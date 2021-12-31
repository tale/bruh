import { commands } from './commands'
import './interface/color'
import { observeMetric } from './perf'

observeMetric('argument-parse', () => {
	// The first two args can always be ignored
	const rawArgs = process.argv.slice(2)
	const directive = rawArgs.shift() ?? 'help'
	const command = commands.find(v => v.name === directive || v.aliases.includes(directive))
	if (!command) {
		process.stdout.write('Unknown command' + '\n')
	}
})
