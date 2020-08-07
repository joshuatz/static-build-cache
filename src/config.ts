import { CacheFileName } from './constants';
import Logger from './logger';
import { Config, MinConfig } from './types';
import { posixNormalize, resolveMixedPath } from './utilities';

export async function processConfig(config: MinConfig): Promise<Config> {
	const logger = new Logger({ silent: config.silent !== true });
	logger.log('Processing config');
	if (!config.projectRoot) {
		throw new Error('Config needs the project root path for basic functionality');
	}

	logger.log({
		require,
		processCwd: process.cwd(),
		dirName: __dirname,
		filename: __filename,
	});

	const callingDir = posixNormalize(process.cwd());
	config.projectRoot = posixNormalize(config.projectRoot);
	config.buildDir = config.buildDir ? posixNormalize(config.buildDir) : './build';

	if (!config.projectRootFull) {
		config.projectRootFull = resolveMixedPath(config.projectRoot, callingDir);
	}

	if (!config.buildDirFull) {
		config.buildDirFull = resolveMixedPath(config.buildDir, config.projectRootFull);
	}

	return {
		projectRoot: config.projectRoot,
		projectRootFull: config.projectRootFull,
		buildDir: config.buildDir,
		buildDirFull: config.buildDirFull,
		buildCmd: config.buildCmd,
		useGit: typeof config.useGit === 'boolean' ? config.useGit : true,
		silent: typeof config.silent === 'boolean' ? config.silent : false,
		cacheFileName: !!config.cacheFileName ? config.cacheFileName : CacheFileName,
	};
}
