import { CacheFileName } from './constants';
import { logger } from './logger';
import { Config, MinConfig } from './types';
import { posixNormalize, resolveMixedPath } from './utilities';

export async function processConfig(config: MinConfig): Promise<Config> {
	const silent: boolean = typeof config.silent === 'boolean' ? config.silent : false;
	global.SILENT = config.silent;
	logger.log(`Processing config`);

	if (!config.projectRoot) {
		logger.warn(
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
		cacheFileName: !!config.cacheFileName ? config.cacheFileName : CacheFileName,
		serveCmd: config.serveCmd,
		servePort: config.servePort || 3000,
	};
}
