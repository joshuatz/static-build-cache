export const logger = {
	log: (...args: any[]) => {
		if (!global.SILENT) {
			console.log.apply(console, args);
		}
	},
	warn: (...args: any[]) => {
		if (!global.SILENT) {
			console.warn.apply(console, args);
		}
	},
	error: (...args: any[]) => {
		if (!global.SILENT) {
			console.error.apply(console, args);
		}
	},
};

export default logger;
