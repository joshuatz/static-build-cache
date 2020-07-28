import * as fs from 'fs';
import { CacheFileName } from './constants';

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

export async function getDataFromFile(
	config: Config
): Promise<Partial<PersistedData> | null> {
	const cacheFilePath = getCacheFilePath(config);
	if (fs.existsSync(cacheFilePath)) {
		return JSON.parse(fs.readFileSync(cacheFilePath).toString());
	}

	return null;
}

export async function canServeFromCache(config: Config) {
	//
}
