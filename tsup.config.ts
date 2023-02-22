import { readFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'
import { load } from 'js-yaml'
import simple_git from 'simple-git'

const header = `// MIT License - Copyright (c) ${new Date().getFullYear()}, Aarnav Tale.`

type config_schema = {
	author_name: string;
	github_url: string;
	support_email: string;
	user_agent: string;
	description: string;
}

const configs_content = await readFile('configs.yaml', 'utf8')
const config = load(configs_content) as config_schema

const git = simple_git('.')
const commit_hash = await git.revparse('HEAD')

const raw_tag = await git.tag(['--sort=-v:refname'])
const version = raw_tag.trim().replace('v', '') ?? '0' // Replace the v prefix in a version if present

const build_time = new Date()
const date_stamp = `${build_time.getFullYear()}.${build_time.getMonth() + 1}.${build_time.getDate()}`

const authority = config.author_name === 'Aarnav Tale' ? '(Official Build)' : `(Unofficial Build by ${config.author_name})`
const bin_identity = `${version}_${date_stamp}_${commit_hash.substring(0, 7)}`

config.user_agent = config.user_agent
	.replace('$VER', version)
	.replace('$COMMIT', commit_hash)

const esbuild_replacement = {
	build_constants: JSON.stringify({
		commit_hash,
		version,
		build_time,
		bin_identity,
		authority,
		config
	})
}

export default defineConfig(options => {
	return {
		esbuildOptions(options) {
			options.define = esbuild_replacement
		},
		banner: {
			js: header
		},
		entry: {
			bruh: './src/index.ts',
		},
		format: ['cjs'],
		target: 'node16',
		splitting: false,
		platform: 'node',
		sourcemap: 'inline',
		minify: !options.watch,
		clean: true
	}
})
