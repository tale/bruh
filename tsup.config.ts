import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'
import { load } from 'js-yaml'
import simple_git from 'simple-git'
import { readKey, readMessage, verify } from 'openpgp'
import { execSync } from 'node:child_process'

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
let version = raw_tag.trim().replace('v', '') // Replace the v prefix in a version if present
if (!version || version.length === 0) {
	version = '0.0-dev'
}

const build_time = new Date()
const date_stamp = `${build_time.getFullYear()}.${build_time.getMonth() + 1}.${build_time.getDate()}`

const bin_identity = `${version}_${date_stamp}_${commit_hash.substring(0, 7)}`
const authority = await verify_build(bin_identity) ? '(Official Build)' : '(Unofficial Build)'

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
		bundle: true,
		skipNodeModulesBundle: false,
		noExternal: ['tar-fs', 'plist'],
		platform: 'node',
		sourcemap: 'inline',
		minify: !options.watch,
		publicDir: 'gpg',
		clean: !options.watch,
	}
})

async function verify_build(bin_identity: string) {
	try {
		const result = await fetch('https://keys.openpgp.org/vks/v1/by-email/aarnavtale@icloud.com', {
			method: 'GET',
			redirect: 'follow',
			headers: {
				'User-Agent': config.user_agent
			}
		})

		if (!result.ok) {
			console.error('Failed to fetch public key from OpenPGP server')
			return false
		}

		const key = await readKey({ armoredKey: await result.text() })
		const keyId = key.getKeyID().toHex()

		await rm('./gpg', { force: true, recursive: true })
		await mkdir('./gpg', { recursive: true })
		await writeFile('./gpg/bruh.ver', `${keyId}|${bin_identity}`)

		const commands = [
			'gpg --sign',
			'-u', key.getKeyID().toHex(),
			'--armor',
			'--output', './gpg/bruh.sig',
			'./gpg/bruh.ver'
		]

		execSync(commands.join(' '))
		const sig = await readFile('./gpg/bruh.sig', 'utf8')

		const message = await readMessage({
			armoredMessage: sig
		})

		const request = await verify({
			message,
			verificationKeys: key
		})

		const { verified } = request.signatures[0];
		try {
			await verified; // throws on invalid signature
			return true
		} catch (e) {
			console.log('Signature could not be verified: ' + e.message);
			return false
		}
	} catch (error) {
		return false
	}
}
