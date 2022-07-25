type Flag = {
	name: string;
	longFlag: `--${string}`;
	shortFlag: `-${string}`;
}

type CommandOptions = {
	name: string;
	description: string;
	flags: Flag[];
}

// Flags is any to support our exported array type
export class Command<Flags = any> {
	options: CommandOptions
	executor: (flags: Flags, arguments_: string[]) => Promise<void>

	constructor(options: CommandOptions, executor: (flags: Flags, arguments_: string[]) => Promise<void>) {
		this.options = options
		this.executor = executor
	}

	async execute(flags: unknown, arguments_: string[]) {
		await this.executor(flags as Flags, arguments_)
	}
}
