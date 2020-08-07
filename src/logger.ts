import { Config } from './types';

type LoggerConfig = Pick<Config, 'silent'>;

export class Logger {
	config: LoggerConfig;
	silent: boolean;

	constructor(config: LoggerConfig) {
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
