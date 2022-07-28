type command_flag = {
	name: string;
	long_flag: `--${string}`;
	short_flag: `-${string}`;
}

type command_options = {
	name: string;
	description: string;
	flags: command_flag[];
}

// Flags is any to support our exported array type
export class Command<Flags = never> {
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
