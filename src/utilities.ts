import * as childProc from 'child_process';
import { ExecOptions } from 'child_process';
import * as fs from 'fs';
import { normalize } from 'path';
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
export async function detectFramework(config: Config): Promise<FrameworkSetting | null> {
	let framework: FrameworkSetting | null = null;
	let buildCmd;
	let serveCmd;
	let hasPackageJson = false;
	// Attempt to get package.json
	try {
		const packageInfo: PackageJson = JSON.parse(
			fs.readFileSync(`${config.projectRootFull}/package.json`).toString()
		);
		hasPackageJson = true;

		// Try to detect specific framework used
		if (packageInfo.dependencies !== undefined) {
			framework =
				!framework && !!packageInfo.dependencies['react']
					? FrameworkDefaults.react
					: framework;
			framework =
				!framework && !!packageInfo.dependencies['vue']
					? FrameworkDefaults.vue
					: framework;
		}

		// Parse Scripts
		if (packageInfo.scripts) {
			for (const cmd of BuildCmds.likely) {
				buildCmd = packageInfo.scripts[cmd] ? cmd : buildCmd;
				if (buildCmd) break;
			}
			if (!buildCmd) {
				for (const cmd of BuildCmds.warn) {
					buildCmd = packageInfo.scripts[cmd] ? cmd : buildCmd;
					if (buildCmd) {
						console.warn(`Running with non-standard build cmd, ${buildCmd}`);
						break;
					}
				}
			}
			for (const cmd of ServeCmds.likely) {
				serveCmd = packageInfo.scripts[cmd] ? cmd : serveCmd;
				if (serveCmd) break;
			}

			/*
			// Prefix with NodeJS runner
			const scriptRunPrefix = `npm run `;
			buildCmd = buildCmd ? `${scriptRunPrefix}${buildCmd}` : buildCmd;
			serveCmd = serveCmd ? `${scriptRunPrefix}${serveCmd}` : serveCmd;
			*/
		}
	} catch (e) {
		console.warn(`Could not find package.json`);
	}

	// Return framework settings, overriding with any detected specifics
	if (buildCmd) {
		const info: FrameworkSetting = {
			name: 'unknown',
			buildCmd,
			buildDirName: 'build',
			serveCmd,
			hasPackageJson,
		};

		// Overrides
		if (framework) {
			let prop: keyof FrameworkSetting;
			for (prop in framework) {
				if (typeof framework[prop] !== 'undefined' && prop in info) {
					(info as any)[prop] = framework[prop];
				}
			}
		}

		// NodeJS script runner prefix
		if (hasPackageJson) {
			const packRunPrefix = `npm run `;
			info.buildCmd = info.buildCmd ? `${packRunPrefix}${info.buildCmd}` : info.buildCmd;
			info.serveCmd = info.serveCmd ? `${packRunPrefix}${info.serveCmd}` : info.serveCmd;
		}

		return info;
	} else {
		return null;
	}
}

export async function execAsync(input: string, opts?: ExecOptions): Promise<string> {
	return new Promise((res, rej) => {
		childProc.exec(input, opts || {}, (err, out) => {
			if (err) {
				rej(err);
				return;
			}

			res(out);
		});
	});
}

/**
 * Normalizes and forces a filepath to the forward slash variant
 *  - Removes trailing slash
 * @example \dir\file.txt will become /dir/file.txt
 * @param {string} filePath the path to normalize
 * @returns The posix foward slashed version of the input
 */
export function posixNormalize(filePath: string): string {
	return removeTrailingSlash(normalize(filePath).replace(/[\/\\]{1,2}/gm, '/'));
}

export function removeTrailingSlash(input: string): string {
	return input.replace(/\/{1,}$/, '');
}

/**
 * Resolve an undetermine path type (mixed or absolute)
 * @param inputPath Mixed - relative or absolute path
 * @param basedDirAbs Absolute base directory path
 */
export function resolveMixedPath(inputPath: string, baseDirAbs: string): string {
	inputPath = posixNormalize(inputPath);
	baseDirAbs = posixNormalize(baseDirAbs);
	if (inputPath.includes(baseDirAbs)) {
		// Since project root includes absolute root dir, assume same as full path
		return inputPath;
	} else {
		// Assume projectRoot is *relative*
		return posixNormalize(`${baseDirAbs}/${inputPath.replace(/^[\\\/\.]*/, '')}`);
	}
}
