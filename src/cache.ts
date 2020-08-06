import * as fs from 'fs';
import { CacheFileName } from './constants';
import Logger from './logger';
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
			{ flag: 'wx' },
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
export async function canServeFromCache(config: Config): Promise<boolean> {
	const logger = new Logger(config);
	try {
		const storedMeta = await getDataFromFile(config);

		if (!storedMeta) {
			return false;
		}

		const lastCommitSha = await getLastCommitSha();
		return lastCommitSha === storedMeta.commitSha;
	} catch (e) {
		// If this is running Glitch, `git` should be available...
		logger.warn(`Use of git log failed:`, e);
		return false;
	}
}
