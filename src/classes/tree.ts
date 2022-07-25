import { fs_cache_parser } from 'fs_parser'
import { log } from 'interface'
import { argv0 } from 'node:process'
import { BruhFormula } from 'types'

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
		const { streamer, decompressor, reader } = fs_cache_parser.database_stream()

		return new Promise<Dependencies>((resolve, reject) => {
			streamer.on('line', async (line: string) => {
				for (const package_ of packages) {
					// All caches start with the package name
					if (!line.startsWith(package_)) {
						continue
					}

					const formula = fs_cache_parser.deserialize(line)

					if (packages.includes(formula.name)) {
						packages = packages.filter(keep => keep !== formula.name)
						resolved.push(formula)
					}
				}

			}).on('close', () => {
				resolve({ resolved, unresolved: packages })
			}).on('SIGINT', () => reject())

			decompressor.on('error', () => reject())
			reader.on('error', () => reject())
		})
	}

	formula: BruhFormula
	childTrees: Tree[] = []

	private constructor(formula: BruhFormula) {
		this.formula = formula
	}

	private async generate() {
		const { resolved, unresolved } = await Tree.resolve(this.formula.dependencies)

		if (unresolved.length > 0) {
			// const text = unresolved.map(value => ''.bold(value))
			// 	.join(' ')
			// log.warning('Unable to resolve the following packages: %s', text)
			// log.error('Try running %s to resolve this.', ''.bold(`${argv0} update`))
			throw {
				name: this.formula.name,
				unresolved: unresolved
			}
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
