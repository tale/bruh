import { log } from 'interface'
import { execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { bruh_formula } from 'types'
import { config } from 'utils'

export async function unsafe_mach_o_rewrite(path: string, formula: bruh_formula) {
	try {
		const binary = await readFile(path)
		const mach_header = extract_mach_header(binary)
		const load_commands = extract_load_commands(binary, mach_header)

		const version = formula.version + (formula.revision > 0 ? `_${formula.revision}` : '')
		const id_path = path.replace(join(config.paths.link, formula.name, version), config.paths.prefix)
		execSync(`install_name_tool -id ${id_path} ${path}`)
		execSync(`codesign -s - ${path}`)

		if (load_commands[0].name.includes('@@HOMEBREW_PREFIX@@')) {
			load_commands.shift()
		}

		for (const command of load_commands) {
			if (!command.name.includes('@@HOMEBREW_CELLAR@@')) {
				return
			}

			const replace = command.name.replace('@@HOMEBREW_CELLAR@@', config.paths.prefix)
			execSync(`install_name_tool -change ${command.name} ${replace} ${path}`)
		}

		execSync(`codesign -s - ${path}`)
	} catch (error: unknown) {
		log.error('Failed to rewrite Mach-O binary', error)
	}
}

export async function extract_mach_o(path: string) {
	try {
		const binary = await readFile(path)
		const mach_header = extract_mach_header(binary)

		if (path.endsWith('node')) {
			get_load_command_offsets(binary, mach_header)
			const load_commands = extract_load_commands(binary, mach_header)
		}
	} catch (error: unknown) {
		if (!(error as Error).message.includes('Mach-O magic')) {
			console.log(error)
		}
	}
}

type mach_header = {
	mach_magic: number;
	cpu_type: number;
	cpu_subtype: number;
	mach_file_type: number;
	load_command_count: number;
	load_region_size: number;
	flags: number;
}

function extract_mach_header(buffer: Buffer) {
	// Some assumptions about this function:
	// - The buffer is at least as large as the mach_header size of 32
	// - The macOS system running this is Little Endian and 64 bit
	const mach_header: mach_header = {
		mach_magic: buffer.readUint32LE(0),
		cpu_type: buffer.readUint32LE(4),
		cpu_subtype: buffer.readUint32LE(8),
		mach_file_type: buffer.readUint32LE(12),
		load_command_count: buffer.readUint32LE(16),
		load_region_size: buffer.readUint32LE(20),
		flags: buffer.readUint32LE(24)
	}

	// eslint-disable-next-line no-bitwise
	mach_header.cpu_subtype &= 0x00_FF_FF_FF

	// 0xfeedfacf = Little Endian, 64 bit
	// 0xcefaedfe = Big Endian, 64 bit
	if (mach_header.mach_magic !== 0xFE_ED_FA_CF && mach_header.mach_magic !== 0xCE_FA_ED_FE) {
		throw new Error('Invalid Mach-O magic')
	}

	return mach_header
}

type load_command = {
	cmd: number; // Uint32_t - Load command type
	cmd_size: number; // Uint32_t - Size of load command in bytes
}

function get_load_command_offsets(buffer: Buffer, mach_header: mach_header) {
	const command_stub_size = 8 // A command is 8 bytes aligned
	const mach_body = buffer.subarray(32) // 32 is mach_header_size

	const combined_previous_command_sizes = 0

	let command_start_offset = 0

	for (let index = 0; index < mach_header.load_command_count; index++) {
		// The command starts here in the full Mach-O binary buffer
		// The next 4 bytes from this offset make up the Uint32_t representing the command type
		// command_start_offset += index * command_stub_size
		console.log(command_start_offset)

		const command_type = mach_body.readUint32LE(command_start_offset)

		// The command size is the next Uint32_t after the command type
		const command_size_offset = command_start_offset + 4
		const command_size = mach_body.readUint32LE(command_size_offset)

		console.log(command_type, command_size)

		const where_tf_loads_start = command_start_offset + 8
		const is_valid = command_type === 0xC || command_type === 0xD // This is id_dylib and load_dylib

		if (is_valid) {
			const command_body = mach_body.subarray(where_tf_loads_start, where_tf_loads_start + command_size)
			const body_name_offset = command_body.readUint32LE(0)
			const c_string_name = command_body.subarray(body_name_offset)
			const command_name = c_string_name.toString('ascii')
				.normalize()
			// .replaceAll('\u0000', '')
			console.log(command_name)
		}

		command_start_offset += command_size

		// eslint-disable-next-line no-bitwise
		if (command_start_offset & command_stub_size) {
			// eslint-disable-next-line no-bitwise
			command_start_offset += command_stub_size - (command_start_offset & command_stub_size)
		}
	}
}

type load_command2 = {
	name: string;
	time_stamp: number;
	current_version: number;
	compatibility_version: number;
	load_start: number;
	command_size: number;
	offset: number;
}

function extract_load_commands(buffer: Buffer, mach_header: mach_header) {
	const load_commands = new Array<load_command2>()

	// We need to align by 8 bytes
	const command_align = 8

	// Mach-O header is 32 bytes
	const mach_body = buffer.subarray(32)

	// eslint-disable-next-line no-sequences
	for (let offset = 0, index = 0; offset + command_align <= mach_body.length, index < mach_header.load_command_count; index++) {
		const load_start = mach_body.readUInt32LE(offset)
		console.log(offset)
		// Checks for load_dylib and id_dylib command types
		const is_valid = load_start === 0xC || load_start === 0xD

		const command_size = mach_body.readUInt32LE(offset + 4) - command_align
		offset += command_align

		// Check if the command_size actually fits in the mach_body
		if (offset + command_size > mach_body.length) {
			continue
		}

		const command_body = mach_body.subarray(offset, offset + command_size)
		offset += command_size

		// eslint-disable-next-line no-bitwise
		if (offset & command_align) {
			// eslint-disable-next-line no-bitwise
			offset += command_align - (offset & command_align)
		}

		if (!is_valid) {
			continue
		}

		const body_name_offset = command_body.readUint32LE(0) - command_align
		const c_string_name = command_body.subarray(body_name_offset)
		const command_name = c_string_name.toString('ascii')
			.normalize()
			// .replaceAll('\u0000', '')

		// if (command_name.includes('@@HOMEBREW_PREFIX@@')) {
		// 	// Console.log('editing %s', command_name)

		// 	const new_name = command_name.replace('@@HOMEBREW_PREFIX@@', '/opt/homebrew')

		// 	const new_command_body = Buffer.allocUnsafe(command_size)
		// 	new_command_body.write(new_name, body_name_offset, 'ascii')
		// 	new_command_body.writeUInt32LE(command_body.readUint32LE(4))
		// 	new_command_body.writeUInt32LE(command_body.readUint32LE(8))
		// 	new_command_body.writeUInt32LE(command_body.readUint32LE(12))

		// 	console.log('old %s', command_body.toString('ascii'))
		// 	console.log('new %s', new_command_body.toString('ascii'))
		// 	console.log()
		// }

		load_commands.push({
			name: command_name,
			time_stamp: command_body.readUint32LE(4),
			current_version: command_body.readUint32LE(8),
			compatibility_version: command_body.readUint32LE(12),
			load_start,
			command_size,
			offset
		})
	}

	return load_commands
}
