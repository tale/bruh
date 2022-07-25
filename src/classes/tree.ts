import { log } from 'interface'
import { createReadStream } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { argv0 } from 'node:process'
import { createInterface } from 'node:readline'
import { BruhFormula } from 'types'
import { config } from 'utils'

type Dependencies = {
	resolved: BruhFormula[];
	unresolved: string[];
}

export class Tree {
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
					for (const package_ of packages) {
						if (!line.startsWith(package_)) { // All caches start with the package name
							continue
						}

						// TODO: Document what a cached tiffy.bruh resolved file looks like
						const match = /^(.*?)\|(.*)\|(.*)\|(.{64})\|(.*)/.exec(line)
						if (!match) {
							log.error('Fatal Error: %s', ''.bold('Invalid cache file encountered'))
							log.error('We should never be here, exiting to prevent further issues.')
							return
						}

						const [_match, name, version, revision, blob, deps] = match
						packages = packages.filter(keep => keep !== package_)
						resolved.push({
							name,
							version,
							revision: Number.parseInt(revision),
							blob,
							dependencies: deps.split(',')
								.filter(Boolean)
						})
					}
				})

				stream.on('data', data => data.toString()
					.replace('$', '\n'))

				reader.on('close', () => {
					resolve({
						unresolved: packages,
						resolved
					})
				})

				reader.on('SIGINT', reject)
			})
		})

		await Promise.allSettled(tasks)
		return { resolved, unresolved: packages }
	}

	formula: BruhFormula
	childTrees: Tree[] = []

	private constructor(formula: BruhFormula) {
		this.formula = formula
	}

	private async generate() {
		const { resolved, unresolved } = await Tree.resolve(this.formula.dependencies)

		if (unresolved.length > 0) {
			const text = unresolved.map(value => ''.bold(value))
				.join(' ')
			log.warning('Unable to resolve the following packages: %s', text)
			log.error('Try running %s to resolve this.', ''.bold(`${argv0} update`))
			return
		}

		for (const dependency of resolved) {
			const tree = new Tree(dependency)
			await tree.generate()
			this.childTrees.push(tree)
		}
	}

	flatten(builderArray?: BruhFormula[]) {
		builderArray = builderArray ?? []

		if (this.childTrees.length > 0) {
			for (const child of this.childTrees) {
				child.flatten(builderArray)
			}
		}

		builderArray.push(this.formula)
		return builderArray
	}
}
