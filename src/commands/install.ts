import { Command, InstalledPackage, Tree } from 'classes'
import { log, Prompt } from 'interface'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { argv0 } from 'node:process'
import { BruhFormula } from 'types'
import { config } from 'utils'

interface Flags {
	reinstall: boolean
	yes: boolean
}

export default new Command<Flags>({
	name: 'install',
	description: 'Install a formula or cask from brew',
	flags: [
		{
			name: 'reinstall',
			longFlag: '--reinstall',
			shortFlag: '-r'
		},
		{
			name: 'yes',
			longFlag: '--yes',
			shortFlag: '-y'
		}
	]
}, async (flags, args) => {
	if (args.length === 0) {
		log.error('You must supply at least one package to install')
		return
	}

	// Check for package indexes, might be worth to try/catch readdir instead of exists?
	if (!existsSync(config.paths.tiffy) || readdirSync(config.paths.tiffy).length === 0) {
		log.error('No available package indexes.')
		log.error('Try running %s to resolve this.', ''.bold(`${argv0} update`))
		return
	}

	await mkdir(config.paths.cache, { recursive: true })
	await mkdir(config.paths.installed, { recursive: true })
	const { resolved, unresolved } = await Tree.resolve(args)

	const tasks = resolved.map(async formula => {
		const exists = await InstalledPackage.exists(formula)
		const tree = await Tree.from(formula)

		return {
			name: tree.formula.name,
			packages: tree.flatten(),
			exists: exists
		}
	})

	const currentlyInstalled = new Array<string>()
	const installCandidates = new Array<string>()
	const downloadRequests = new Array<BruhFormula>()
	const allViewableDependencies = new Array<string>()

	const results = await Promise.allSettled(tasks)
	for (const result of results) {
		if (result.status !== 'fulfilled') {
			const { name, unresolved } = result.reason
			log.error('Cannot resolve the following dependencies for %s', ''.bold(name))
			log.error(unresolved.join(' '))
			continue
		}

		const { name, packages, exists } = result.value
		if (exists && !flags.reinstall) {
			currentlyInstalled.push(name)
			continue
		}

		installCandidates.push(name)
		downloadRequests.push(...packages)

		// Retrieves a nice list of all the dependencies for display
		const niceDependencies = packages.filter(formula => {
			return formula.name !== name
		}).map(formula => {
			return formula.name
		})

		allViewableDependencies.push(...niceDependencies)
	}

	if (unresolved.length > 0) {
		const list = ''.bold(unresolved.join(' '))
		log.warning('Skipping the following unresolved packages: %s', list)
		log.warning('Try running %s to resolve this.', ''.bold(`${argv0} update`))
	}

	if (currentlyInstalled.length > 0 && !flags.reinstall) {
		const list = ''.bold(currentlyInstalled.join())
		log.error('The following packages are already installed: %s', list)
		log.warning('To reinstall packages, try running %s or enabling the %s flag',
			''.bold(`${argv0} reinstall`),
			''.bold('--reinstall (-r)')
		)
		return
	}

	if (resolved.length === 0) {
		return
	}

	log.info('The following new packages will be installed: %s', ''.bold(installCandidates.join(' ')))

	const dependencies = [...new Set(allViewableDependencies)]
	if (dependencies.length > 0) {
		log.info('The following additional packages will be installed: %s', ''.dim(dependencies.join(' ')))
	}

	if (!flags.yes) {
		const result = await Prompt.confirm('Proceed with the installation?')
		if (!result) {
			log.error('Aborting')
			return
		}
	}

	// Messy looking deduplication; but it's fast
	const downloads = downloadRequests.filter((formula, index, array) => {
		return array.findIndex(subformula => subformula.name === formula.name) === index
	})
})
