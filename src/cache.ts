import * as fs from 'fs';
import { CacheFileName, NonGitCacheDurationMs } from './constants';
import logger from './logger';
import { Config, PersistedData } from './types';
import { getLastCommitSha } from './utilities';

function getCacheFilePath(config: Config): string {
	return `${config.projectRootFull}/${CacheFileName}`;
}

/**
 * Save cache meta info to file
 * @param data Data to store in cache meta file
 * @param config
 * @returns cacheFilePath - where the cache info file is stored
 */
export async function writeDataToFile(
	data: PersistedData,
	config: Config
): Promise<string> {
	return new Promise((res, rej) => {
		const cacheFilePath = getCacheFilePath(config);
		fs.writeFile(
			`${cacheFilePath}`,
			JSON.stringify(data, null, '\t'),
			{ flag: 'w' },
			(err) => {
				if (err) rej(err);
				res(cacheFilePath);
			}
		);
	});
}

/**
 * Get cache data from stored file
 * @param config Config options object
 */
export async function getDataFromFile(
	config: Config
): Promise<Partial<PersistedData> | null> {
	const cacheFilePath = getCacheFilePath(config);
	if (fs.existsSync(cacheFilePath)) {
		return JSON.parse(fs.readFileSync(cacheFilePath).toString());
	}

	return null;
}

/**
 * Determine whether or not a rebuild is necessary based on last-build info
 * @param config Config options object
 */
export async function canServeFromCache(
	config: Config
): Promise<{ canServe: boolean; reason: string }> {
	try {
		const storedMeta = await getDataFromFile(config);

		if (!storedMeta) {
			return {
				canServe: false,
				reason: 'Could not find / parse cache meta file',
			};
		}

		// Check git for changes
		try {
			const lastCommitSha = await getLastCommitSha(true, false, config.projectRootFull);
			const lastShaIsSame: boolean = lastCommitSha === storedMeta.commitSha;
			return {
				canServe: lastShaIsSame,
				reason: lastShaIsSame
					? 'last git SHA is identical'
					: 'last git SHA changed - something was edited',
			};
		} catch (e) {
			// If this is running Glitch, `git` should be available...
			logger.warn(`Use of git log failed:`, e);
		}

		// Fallback - check build time
		const now = new Date();
		const sinceLastBuildMs = Math.abs((storedMeta.builtAt || 0) - now.getTime());
		logger.log({ sinceLastBuildMs });
		return {
			canServe: sinceLastBuildMs < NonGitCacheDurationMs,
			reason: `Based on elapsed since last build time`,
		};
	} catch (e) {
		return {
			canServe: false,
			reason: `Fatal error trying to determine cache status`,
		};
	}
}
