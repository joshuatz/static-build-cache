import * as childProc from 'child_process';
import * as fs from 'fs';
import { PackageJson } from 'type-fest';
import { BuildCmds, FrameworkDefaults, ServeCmds } from './constants';

/**
 * Get the last commit SHA (Git)
 * @param [full] Get full SHA vs abbreviated
 */
export async function getLastCommitSha(full = true): Promise<string> {
	return execAsync(`git rev-parse${full ? `` : ` --short`} HEAD`);
}

/**
 * Attemps to detect the framework being used and the build system
 */
// @ts-ignore
export async function detectFramework(
	rootDir: String
): Promise<FrameworkSetting | null> {
	let foundFramework = null;
	let framework: FrameworkSetting | null = null;
	let buildDir;
	let buildCmd;
	let serveCmd;
	// Attempt to get package.json
	// @todo
	try {
		const packageInfo: PackageJson = JSON.parse(
			fs.readFileSync(`${rootDir}/package.json`).toString()
		);
		if (packageInfo.dependencies !== undefined) {
			framework = !!packageInfo.dependencies['react']
				? FrameworkDefaults.react
				: framework;
		}
		if (packageInfo.scripts) {
			for (const cmd of BuildCmds.likely) {
				buildCmd = packageInfo.scripts[cmd] ? cmd : buildCmd;
				if (buildCmd) break;
			}
			for (const cmd of BuildCmds.warn) {
				buildCmd = packageInfo.scripts[cmd] ? cmd : buildCmd;
				if (buildCmd) {
					console.warn(`Running with non-standard build cmd, ${buildCmd}`);
					break;
				}
			}
			for (const cmd of ServeCmds.likely) {
				serveCmd = packageInfo.scripts[cmd] ? cmd : serveCmd;
				if (serveCmd) break;
			}
		}
	} catch (e) {
		console.log(`Could not find package.json`);
	}

	// Return framework settings, overriding with any detected specifics
	if (buildCmd) {
		const info: FrameworkSetting = {
			name: 'unknown',
			buildCmd,
			buildDirName: 'build',
		};
		info.serveCmd = serveCmd || info.serveCmd;
		if (framework) {
			info.name = framework.name;
		}
		return info;
	} else {
		return null;
	}
}

export async function execAsync(input: string): Promise<string> {
	return new Promise((res, rej) => {
		childProc.exec(input, (err, out) => {
			if (err) {
				rej(err);
				return;
			}

			res(out);
		});
	});
}
