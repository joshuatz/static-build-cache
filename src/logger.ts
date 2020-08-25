export const logger = {
	log: (...args: any[]) => {
		if (!global.SILENT) {
			console.log.apply(console, args);
		}
	},
	warn: (...args: any[]) => {
		if (!global.SILENT) {
			// !!! - In NodeJS, console.warn is simply an alias for console.error,
			// Don't use console.warn unless you want stderr exceptions on warnings...
			// Instead, we'll prefix messages
			if (typeof args[0] === 'string' && !/warn/gim.test(args[0])) {
				args.unshift('Warning!:');
			}
			console.log.apply(console, args);
		}
	},
	error: (...args: any[]) => {
		if (!global.SILENT) {
			console.error.apply(console, args);
		}
	},
};

export const verboseLogger = {
	log: (...args: any[]) => {
		if (global.VERBOSE) {
			logger.log.apply(logger, args);
		}
	},
	warn: (...args: any[]) => {
		if (global.VERBOSE) {
			logger.warn.apply(logger, args);
		}
	},
	error: (...args: any[]) => {
		if (global.VERBOSE) {
			logger.error.apply(logger, args);
		}
	},
};

export default logger;
