import { Config } from './types';

export class Logger {
	config: Config;
	silent: boolean;

	constructor(config: Config) {
		this.config = config;
		// this.silent = config.silent;
		this.silent = false;
	}

	public log(...args: any[]) {
		if (!this.silent) {
			console.log.apply(console, args);
		}
	}

	public warn(...args: any[]) {
		if (!this.silent) {
			console.warn.apply(console, args);
		}
	}

	public error(...args: any[]) {
		if (!this.silent) {
			console.error.apply(console, args);
		}
	}
}

export default Logger;
