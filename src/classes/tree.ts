import { log } from 'interface'
import { createReadStream } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { BruhFormula } from 'types'
import { config } from 'utils'

type Dependencies = {
	resolved: BruhFormula[]
	unresolved: string[]
}

export class Tree {
	formula: BruhFormula
	childTree: Tree[] = []

	static async from(formula: BruhFormula) {
		const tree = new Tree(formula)
		await tree.generate()
		return tree
	}

	static async resolve(packages: string[]) {
		const resolved = new Array<BruhFormula>()

		const files = await readdir(config.paths.tiffy)
		const tasks = files.map(async file => {
			const stream = createReadStream(join(config.paths.tiffy, file))
			const reader = createInterface(stream)

			return new Promise<Dependencies>((resolve, reject) => {
				reader.on('line', async line => {
					for (const pkg of packages) {
						if (!line.startsWith(pkg)) { // All caches start with the package name
							continue
						}

						// TODO: Document what a cached tiffy.bruh resolved file looks like
						const match = line.match(/^(.*?)\$(.*)\$\$(.*)\$\$\$(.{64})\$\$\$\$(.*)$/)
						if (!match) {
							log.error('Fatal Error: %s', ''.bold('Invalid cache file encountered'))
							log.error('We should never be here, exiting to prevent further issues.')
							return
						}

						const [_match, name, version, revision, blob, deps] = match
						packages = packages.filter(keep => keep !== pkg)
						resolved.push({
							name: name,
							version: version,
							revision: parseInt(revision),
							blob: blob,
							dependencies: deps.split(',').filter(Boolean)
						})
					}
				})

				reader.on('close', () => {
					resolve({
						unresolved: packages,
						resolved: resolved
					})
				})

				reader.on('SIGINT', reject)
			})
		})

		await Promise.allSettled(tasks)
		return { resolved, unresolved: packages }
	}

	private constructor(formula: BruhFormula) {
		this.formula = formula
	}

	private async generate() {
		const {} = resolve(this.formula.dependencies)
	}
}
