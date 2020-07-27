import * as childProc from 'child_process';
import * as fs from 'fs';

export async function getLastCommitSha(): Promise<string> {
	return new Promise((res, rej) => {
		childProc.exec(`git rev-parse HEAD`, (err, out) => {
			if (err) {
				rej(err);
				return;
			}

			res(out);
		});
	});
}

/**
 * Attemps to detect the framework being used and the build system
 */
export async function detectFramework(rootDir: String): Promise<FrameworkSetting | null> {
	// Attempt to get package.json
	// @todo
}
