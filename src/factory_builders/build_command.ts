type command_flag = {
	name: string;
	description: string;
	long_flag: `--${string}`;
	short_flag: `-${string}`;
}

type command_options = {
	name: string;
	usage: string;
	description: string;
	flags: command_flag[];
}

// Flags is any to support our exported array type
class Command<Flags = never> {
	private readonly command_options: command_options
	private readonly exec_op: (flags: Flags, runtime_arguments: string[]) => Promise<number | undefined>

	constructor(options: command_options, executor: (flags: Flags, runtime_arguments: string[]) => Promise<number | undefined>) {
		this.command_options = options
		this.exec_op = executor
	}

	get options() {
		return this.command_options
	}

	async run(flags: unknown, runtime_arguments: string[]) {
		return this.exec_op(flags as Flags, runtime_arguments)
	}
}

export function build_command<flag_types = never>(options: command_options, executor: (flags: flag_types, runtime_arguments: string[]) => Promise<number | undefined>) {
	return new Command<flag_types>(options, executor)
}

export type command_type = Command
