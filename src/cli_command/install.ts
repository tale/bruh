import { Command, InstalledPackage, Tree } from 'classes'
import { log, Prompt } from 'interface'
import { constants } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'
import { argv0 } from 'node:process'
import { BruhFormula } from 'types'
import { config, exit_code } from 'utils'

interface Flags {
	reinstall: boolean;
	yes: boolean;
}

export default new Command<Flags>({
	name: 'install',
	description: 'Install a formula or cask from brew',
	flags: [
		{
			name: 'reinstall',
			long_flag: '--reinstall',
			short_flag: '-r'
		},
		{
			name: 'yes',
			long_flag: '--yes',
			short_flag: '-y'
		}
	]
}, async (flags, arguments_) => {
	if (arguments_.length === 0) {
		log.error('You must supply at least one package to install')
		return
	}

	try {
		// Checking if our update cache is readable
		await access(config.paths.tiffy, constants.R_OK)
	} catch {
		log.error('No available package indexes.')
		log.error('Try running %s to resolve this.', ''.bold(`${argv0} update`))
		return
	}

	await mkdir(config.paths.cache, { recursive: true })
	const { resolved, unresolved } = await Tree.resolve(arguments_)

	const tasks = resolved.map(async formula => {
		const exists = await InstalledPackage.exists(formula)
		const tree = await Tree.from(formula)

		return {
			name: tree.formula.name,
			packages: tree.flatten(),
			exists
		}
	})

	const currentlyInstalled = new Array<string>()
	const installCandidates = new Array<string>()
	const downloadRequests = new Array<BruhFormula>()
	const allViewableDependencies = new Array<string>()

	const results = await Promise.allSettled(tasks)
	for (const result of results) {
		if (result.status !== 'fulfilled') {
			const { name, unresolved: unresolvedDependencies } = result.reason
			log.error('Cannot resolve the following dependencies for %s: %s', ''.bold(name), ''.dim(unresolvedDependencies.join(' ')))
			unresolved.push(name)
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
		const niceDependencies = packages.filter(formula => formula.name !== name)
			.map(formula => formula.name)

		allViewableDependencies.push(...niceDependencies)
	}

	if (unresolved.length > 0) {
		const list = ''.dim(unresolved.join(' '))
		log.warning('Skipping the following packages due to errors: %s', list)
		log.warning('Try running %s to resolve this.', ''.bold(`${argv0} update`))
	}

	if (currentlyInstalled.length > 0 && !flags.reinstall) {
		const list = ''.bold(currentlyInstalled.join(','))
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

	if (installCandidates.length === 0) {
		throw exit_code.error
	}

	log.blank()
	log.info('The following new packages will be installed: %s', ''.bold(installCandidates.join(' ')))

	const dependencies = [...new Set(allViewableDependencies)].sort()
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
	const deduplicatedDownloads = downloadRequests.filter((formula, index, array) => array.findIndex(subformula => subformula.name === formula.name) === index)
	// Const downloadTasks = deduplicatedDownloads.map(async formula => {})
})
