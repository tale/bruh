import { cache_handler } from 'fs_parser'
import { bruh_formula } from 'types'

type Dependencies = {
	resolved: bruh_formula[];
	unresolved: string[];
}

export class Tree {
	static async from(formula: bruh_formula) {
		const tree = new Tree(formula)
		await tree.generate()
		return tree
	}

	static async resolve(packages: string[]) {
		const resolved = new Array<bruh_formula>()
		const { streamer, decompressor, reader } = cache_handler.database_stream()

		return new Promise<Dependencies>((resolve, reject) => {
			streamer.on('line', async (line: string) => {
				for (const package_ of packages) {
					// All caches start with the package name
					if (!line.startsWith(package_)) {
						continue
					}

					const formula = cache_handler.deserialize(line)

					if (packages.includes(formula.name)) {
						packages = packages.filter(keep => keep !== formula.name)
						resolved.push(formula)
					}
				}
			})
				.on('close', () => {
					resolve({ resolved, unresolved: packages })
				})
				.on('SIGINT', () => {
					reject()
				})

			decompressor.on('error', () => {
				reject()
			})
			reader.on('error', () => {
				reject()
			})
		})
	}

	formula: bruh_formula
	childTrees: Tree[] = []

	private constructor(formula: bruh_formula) {
		this.formula = formula
	}

	private async generate() {
		const { resolved, unresolved } = await Tree.resolve(this.formula.dependencies)

		if (unresolved.length > 0) {
			// Const text = unresolved.map(value => ''.bold(value))
			// 	.join(' ')
			// log.warning('Unable to resolve the following packages: %s', text)
			// log.error('Try running %s to resolve this.', ''.bold(`${argv0} update`))
			throw {
				name: this.formula.name,
				unresolved
			}
		}

		for (const dependency of resolved) {
			const tree = new Tree(dependency)
			await tree.generate()
			this.childTrees.push(tree)
		}
	}

	flatten(builderArray?: bruh_formula[]) {
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
