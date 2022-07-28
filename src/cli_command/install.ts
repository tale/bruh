import { Command } from 'classes'
import { install_database } from 'fs_parser'
import { log, Prompt } from 'interface'
import { depend_tree } from 'mod_hack'
import { constants } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'
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
}, async (flags, cli_arguments) => {
	if (cli_arguments.length === 0) {
		log.error('No packages supplied. Exiting...')
		return exit_code.error
	}

	try {
		// Checking if our update cache is readable
		await access(config.paths.tiffy, constants.R_OK)
	} catch {
		log.error('No available package indexes.')
		log.error('Try running %s to resolve this.', ''.bold(`${config.bin_entry} update`))
		return exit_code.error
	}

	await mkdir(config.paths.cache, { recursive: true })
	const { resolved, unresolved } = await depend_tree.resolve_flat(cli_arguments)

	// Check for preinstalled formulas
	const pre_installed = new Array<string>()
	const install_checks = resolved.map(async formula => {
		// Don't run expensive calculations if we already allow reinstalling
		if (flags.reinstall) {
			return
		}

		if (await install_database.is_installed(formula)) {
			pre_installed.push(formula.name)
		}
	})

	await Promise.all(install_checks)

	// Calculate the pending top level formulas to install
	const top_level_installs = new Set(resolved.filter(to_keep => {
		if (pre_installed.includes(to_keep.name)) {
			return false
		}

		if (cli_arguments.includes(to_keep.name)) {
			return true
		}

		return false
	}))

	// Calculate all the secondary dependencies to install
	const dependency_installs = new Set(resolved.filter(formula => {
		if (top_level_installs.has(formula)) {
			return false
		}

		if (pre_installed.includes(formula.name)) {
			return false
		}

		return true
	}))

	// Exit early if nothing is resolved
	if (resolved.length === 0) {
		log.warning('Unable to resolve the following packages: %s', ''.dim(unresolved.join(' ')))
		log.warning('Try running %s to resolve this.', ''.bold(`${config.bin_entry} update`))
		return exit_code.error
	}

	// Handle unresolved formulas (not erroring, just warning)

	if (unresolved.length > 0) {
		log.warning('Skipping the following unresolved packages: %s', ''.dim(unresolved.join(' ')))
		log.warning('Try running %s to resolve this.', ''.bold(`${config.bin_entry} update`))
	}

	// This can only be greater than 0 if flags.reinstall is false
	if (pre_installed.length > 0) {
		const list = ''.bold(pre_installed.join(', '))
		log.error('The following packages are already installed: %s', list)
		log.warning('To reinstall packages, try running %s or enabling the %s flag',
			''.bold(`${config.bin_entry} reinstall`),
			''.bold('--reinstall (-r)')
		)

		return exit_code.error
	}

	log.blank()

	const printable_top_level_installs = [...top_level_installs].map(formula => formula.name)
	const printable_dependency_installs = [...dependency_installs].map(formula => formula.name)

	log.info('The following new packages will be installed: %s', ''.bold(printable_top_level_installs.join(', ')))

	if (dependency_installs.size > 0) {
		log.info('The following additional packages will be installed: %s', ''.dim(printable_dependency_installs.join(' ')))
	}

	if (!flags.yes) {
		const result = await Prompt.confirm('Proceed with the installation?')
		if (!result) {
			log.error('Aborting')
			return
		}
	}

	// Set automatically deduplicates anything that may still be on both
	const download_list = new Set([...top_level_installs, ...dependency_installs])
})
