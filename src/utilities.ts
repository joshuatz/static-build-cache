import {
	ChildProcess,
	ChildProcessWithoutNullStreams,
	exec,
	ExecOptions,
	ExecSyncOptions,
	spawn,
} from 'child_process';
import * as fs from 'fs';
import { isAbsolute, normalize } from 'path';
import { PackageJson } from 'type-fest';
import { BuildCmds, FrameworkDefaults, ServeCmds } from './constants';
import logger from './logger';
import { Config, PipelineSetting } from './types';

/**
 * Get the last commit SHA (Git)
 * @param [full] Get full SHA vs abbreviated
 * @param [noFail] Catch error and return undefined
 * @param rootDir Project directory that has git history
 */
export async function getLastCommitSha(
	full = true,
	noFail = false,
	rootDir?: string
): Promise<string | undefined> {
	let sha;
	const opts = rootDir ? { cwd: rootDir } : {};
	try {
		sha = await execAsync(`git rev-parse${full ? `` : ` --short`} HEAD`, opts);
		// Remove any trailing spaces and/or carriage returns
		return sha.replace(/[\s]/g, '');
	} catch (e) {
		if (noFail) {
			return undefined;
		}

		throw e;
	}
}

/**
 * Attemps to detect the framework being used and the build system
 */
export async function detectPipeline(config: Config): Promise<PipelineSetting | null> {
	let frameworkInfo: PipelineSetting | null = null;
	let buildCmd;
	let serveCmd;
	let hasPackageJson = false;
	// Attempt to get package.json
	const packageJsonPath = `${config.projectRootFull}/package.json`;
	try {
		const packageInfo: PackageJson = JSON.parse(
			fs.readFileSync(packageJsonPath).toString()
		);
		hasPackageJson = true;

		// Try to detect specific framework used
		if (packageInfo.dependencies !== undefined) {
			frameworkInfo =
				!frameworkInfo && !!packageInfo.dependencies['react']
					? FrameworkDefaults.react
					: frameworkInfo;
			frameworkInfo =
				!frameworkInfo && !!packageInfo.dependencies['vue']
					? FrameworkDefaults.vue
					: frameworkInfo;
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
		}
	} catch (e) {
		console.warn(`Could not find package.json at path ${packageJsonPath}`);
	}

	// Return framework settings, overriding with any detected specifics
	if (buildCmd) {
		const info: PipelineSetting = {
			frameworkName: 'unknown',
			buildCmd,
			buildDirName: 'build',
			serveCmd,
			hasPackageJson,
		};

		// Overrides
		if (frameworkInfo) {
			// Don't override `scripts` based settings, etc.
			const allowedOverrides: Array<keyof PipelineSetting> = [
				'frameworkName',
				'buildDirName',
			];
			for (const prop of allowedOverrides) {
				if (typeof frameworkInfo[prop] !== 'undefined' && prop in info) {
					(info as any)[prop] = frameworkInfo[prop];
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

export async function execAsync(input: string, opts?: ExecSyncOptions): Promise<string> {
	let callOpts = opts || {};
	callOpts = {
		encoding: 'utf8',
		...callOpts,
	};
	return new Promise((res, rej) => {
		try {
			const childProc = exec(input, callOpts, (err, out) => {
				if (err) {
					rej(err);
					return;
				}

				res(out);
			});
		} catch (e) {
			rej(e);
		}
	});
}

/**
 * Execute a command with child-process, and receive data via callbacks
 * @param input cmd to execute
 * @param args Optional arguments to pass
 * @param opts Options
 * @param callbacks Receive data stream from child process
 * @param encoding
 */
export async function execAsyncWithCbs(
	cmd: string,
	args: string[] = [],
	opts?: ExecOptions,
	callbacks?: {
		stdout?: (output: string) => void | Function;
		stderr?: (output: string) => void | Function;
		close?: (output: string) => void | Function;
		onExit?: (exitCode: number | null, output?: string) => void | Function;
		receiveProc?: (proc: ChildProcess | ChildProcessWithoutNullStreams) => void;
	},
	failOnNonZeroExit = true,
	encoding: BufferEncoding = 'utf8'
): Promise<string> {
	return new Promise((res, rej) => {
		let output = '';
		const spawnedProc = spawn(cmd, args, {
			shell: true,
			windowsHide: true,
			...opts,
		});
		// Pass to callback
		if (callbacks?.receiveProc) {
			callbacks.receiveProc(spawnedProc);
		}
		// Attach listeners
		const stdoutCb = callbacks?.stdout || (() => {});
		const stderrCb = callbacks?.stderr || (() => {});
		// Listeners - stdout
		spawnedProc.stdout.setEncoding(encoding);
		spawnedProc.stdout.on('data', (data) => {
			data = data.toString();
			output += data;
			stdoutCb(data);
		});
		// Listeners - stderr
		spawnedProc.stderr.setEncoding(encoding);
		spawnedProc.stderr.on('data', (data) => {
			data = data.toString();
			output += data;
			stderrCb(data);
		});
		// Listeners - close
		if (callbacks?.close) {
			spawnedProc.on('close', callbacks.close);
		}

		// Collect output and return
		spawnedProc.on('exit', (exitCode) => {
			const success: boolean = exitCode === 0;
			if (callbacks?.onExit) {
				callbacks.onExit(exitCode, output);
			}
			if (success || failOnNonZeroExit === false) {
				res(output);
			} else {
				rej(output);
			}
		});

		spawnedProc.on('error', rej);
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
export function resolveMixedPath(baseDirAbs: string, inputPath: string): string {
	inputPath = posixNormalize(inputPath);
	baseDirAbs = posixNormalize(baseDirAbs);
	if (inputPath.includes(baseDirAbs) || isAbsolute(inputPath)) {
		// Assume input path *IS* full path, if...
		// - Project root includes absolute root dir
		// - Input path is determined to be absolute
		return inputPath;
	} else {
		// Assume projectRoot is *relative*
		return posixNormalize(`${baseDirAbs}/${inputPath.replace(/^[\\\/\.]*/, '')}`);
	}
}

export async function exitProgram(exitCode: number = 0, cleanup?: Array<ChildProcess>) {
	logger.log(`Exiting`);
	await stopProgram(cleanup);
	process.exit(exitCode);
}

/**
 * Exit the entire program, clean up if necessary
 */
export async function stopProgram(cleanup?: Array<ChildProcess>) {
	/**
	 * Clean up processes
	 *  - This might still leave detached services / processes
	 *  - SIGINT seems to work better than SIGHUP
	 */
	const procsToKill: Array<ChildProcess> = Array.isArray(cleanup) ? cleanup : [];
	const runningProcs = global.RUNNING_PROCS || {};
	if (global.RUNNING_PROCS && typeof global.RUNNING_PROCS === 'object') {
		Object.keys(runningProcs).forEach((key) => {
			const procKey = key as keyof typeof runningProcs;
			if (runningProcs[procKey]) {
				procsToKill.push(runningProcs[procKey]!);
			}
		});
	}

	if (global.SERVER && typeof global.SERVER.close === 'function') {
		logger.log('Shutting down server');
		await new Promise((res) => global.SERVER!.close(res));
	}

	logger.log(`Killing processes - IDs: ${procsToKill.map((proc) => proc.pid)}`);
	procsToKill.forEach((proc) => proc.kill('SIGINT'));
}

export const delay = (delayMs: number): Promise<void> => {
	return new Promise((res) => setTimeout(res, delayMs));
};
