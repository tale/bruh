import { createWriteStream } from 'node:fs'
import { access, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { BruhFormula } from 'types'
import { config } from 'utils'

export class InstalledPackage {
	private formula: BruhFormula
	private files: string[] = []

	static async exists(formula: BruhFormula) {
		try {
			const path = join(config.paths.installed, `${formula.name}#${formula.version}#${formula.revision}.bruh`)
			await access(join(path))
			return true
		} catch {
			return false
		}
	}

	static async delete(formula: BruhFormula) {
		const path = join(config.paths.installed, `${formula.name}#${formula.version}#${formula.revision}.bruh`)
		const data = await readFile(path, 'utf8')
		const lines = data.trim().split('\n')

		const definition = lines.shift()
		if (definition !== `##BRUHFILE_DEFINITION## ${JSON.stringify(formula)}`) {
			throw new Error('Mismatched installed lockfile')
		}

		const tasks = lines.map(async path => {
			await rm(path, { recursive: true, force: true })
		})

		await Promise.all(tasks)
		await rm(join(path), { force: true })
		// TODO: Delete linkPath stuff
	}

	constructor(formula: BruhFormula) {
		this.formula = formula
	}

	addFile(path: string) {
		// Path is expected to be relative to the link path for bruh
		this.files.push(path)
	}

	async flush() {
		const path = join(config.paths.installed, `${this.formula.name}#${this.formula.version}#${this.formula.revision}.bruh`)
		const stream = createWriteStream(path)

		stream.write(`##BRUHFILE_DEFINITION## ${JSON.stringify(this.formula)}\n`)
		for (const path of this.files) {
			stream.write(path.concat('\n'))
		}

		await new Promise((resolve, reject) => {
			stream.on('finish', resolve)
			stream.on('error', reject)
		})
	}
}
