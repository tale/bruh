import { constants } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'

import { build_command } from 'factory_builders'
import { bin_tool, local_state } from 'fs_parser'
import { download_tracker, log } from 'interface'
import { depend_tree } from 'mod_hack'
import { ghcr_bintray } from 'net_fetch'
import { type bruh_formula, type bruh_formula_state } from 'types'
import { config, exit_code } from 'utils'

export default build_command<{
	reinstall: boolean;
}>({
	name: 'install',
	usage: '<formula> [formula...]',
	description: 'Install a formula or cask from brew',
	flags: [
		{
			name: 'reinstall',
			description: 'Reinstall a formula or cask',
			long_flag: '--reinstall',
			short_flag: '-r'
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
	const installed_formulas = await local_state.get_installed()

	for (const formula of resolved) {
		// Don't run expensive calculations if we already allow reinstalling
		if (flags.reinstall) {
			continue
		}

		const already_installed = installed_formulas.find(installed => installed.name === formula.name)
		if (already_installed) {
			pre_installed.push(formula.name)
		}
	}

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

	const printable_top_level_installs = [...top_level_installs]
		.filter((formula, index, array) => formula_filter_predicate(formula, index, array))
		.map(formula => formula.name)
		.sort()

	const printable_dependency_installs = [...dependency_installs]
		.filter((formula, index, array) => formula_filter_predicate(formula, index, array))
		.map(formula => formula.name)
		.sort()

	log.info('The following new packages will be installed: %s', ''.bold(printable_top_level_installs.join(', ')))

	if (dependency_installs.size > 0) {
		log.info('The following additional packages will be installed: %s', ''.dim(printable_dependency_installs.join(' ')))
	}

	const download_list = [...top_level_installs, ...dependency_installs]
		.filter((formula, index, array) => formula_filter_predicate(formula, index, array))
		.sort((a, b) => a.name.localeCompare(b.name))

	const download_iterate = download_tracker.build_iterator(download_list.length, 'download')
	const link_iterate = download_tracker.build_iterator(download_list.length, 'link')

	const install_paths = new Array<bruh_formula_state>()
	const install_tasks = download_list.map(async formula => {
		await ghcr_bintray.download(formula)
		download_iterate(formula)
	})

	await Promise.all(install_tasks)

	for await (const formula of download_list) {
		await bin_tool.unpack(formula)
		const { paths, directory } = await bin_tool.link(formula)

		install_paths.push({
			...formula,
			linked: cli_arguments.includes(formula.name),
			files: paths,
			files_prefix: directory
		})

		link_iterate(formula)
	}

	await local_state.mark_as_installed(...install_paths)
})

// Fast but hacky deduplication sequence
const formula_filter_predicate = ((formula: bruh_formula, index: number, array: bruh_formula[]) =>
// Removes duplicates from the array based on the formula name
	array.findIndex(subformula => subformula.name === formula.name) === index
)

