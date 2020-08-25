import { CacheFileName } from './constants';
import { verboseLogger } from './logger';
import { Config, MinConfig } from './types';
import { posixNormalize, resolveMixedPath } from './utilities';

export async function processConfig(config: MinConfig): Promise<Config> {
	const silent: boolean = typeof config.silent === 'boolean' ? config.silent : false;
	global.SILENT = config.silent;
	const verbose: boolean =
		typeof config.verbose === 'boolean' && !silent ? config.verbose : false;
	global.VERBOSE = verbose;
	verboseLogger.log(`Processing config`);

	if (!config.projectRoot) {
		verboseLogger.warn(
			`Config did not specify project root; program will assume same as calling dir.`
		);
		config.projectRoot = '.';
	}

	const callingDir = posixNormalize(process.cwd());
	config.projectRoot = posixNormalize(config.projectRoot);
	config.buildDir = config.buildDir ? posixNormalize(config.buildDir) : './build';

	if (!config.projectRootFull) {
		config.projectRootFull = resolveMixedPath(callingDir, config.projectRoot);
	}

	if (!config.buildDirFull) {
		config.buildDirFull = resolveMixedPath(config.projectRootFull, config.buildDir);
	}

	return {
		projectRoot: config.projectRoot,
		projectRootFull: config.projectRootFull,
		buildDir: config.buildDir,
		buildDirFull: config.buildDirFull,
		buildCmd: config.buildCmd,
		useGit: typeof config.useGit === 'boolean' ? config.useGit : true,
		silent,
		verbose,
		cacheFileName: !!config.cacheFileName ? config.cacheFileName : CacheFileName,
		serveCmd: config.serveCmd,
		servePort: config.servePort || 3000,
	};
}
