import * as fs from 'fs';
import { CacheFileName } from './constants';
import Logger from './logger';
import { getLastCommitSha } from './utilities';

function getCacheFilePath(config: Config): string {
	return `${config.projectRootFull}/${CacheFileName}`;
}

export async function writeDataToFile(data: PersistedData, config: Config) {
	return new Promise((res, rej) => {
		fs.writeFile(
			`${getCacheFilePath(config)}`,
			JSON.stringify(data, null, '\t'),
			{ flag: 'wx' },
			(err) => {
				if (err) rej(err);
				res();
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
