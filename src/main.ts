import { canServeFromCache, writeDataToFile } from './cache';
import { processConfig } from './config';
import { PackageRoot } from './constants';
import Logger from './logger';
import { MinConfig, PersistedData } from './types';
import {
	detectFramework,
	execAsyncWithCbs,
	exitProgram,
	getLastCommitSha,
} from './utilities';

// Catch SIGINT and close out program
process.on('SIGINT', (signal) => {
	exitProgram();
});

export async function main(inputConfig: MinConfig) {
	const config = await processConfig(inputConfig);
	const logger = new Logger(config);
	const frameworkSettings = await detectFramework(config);
	global.RUNNING_PROCS = {
		serve: undefined,
		build: undefined,
	};

	if (!frameworkSettings) {
		return;
	}

	// Compute final commands
	const buildCmd = config.buildCmd || frameworkSettings.buildCmd;
	let serveCmd = config.serveCmd || frameworkSettings.serveCmd;
	const callbacks: Parameters<typeof execAsyncWithCbs>[3] = {
		stdout: logger.log.bind(logger),
		stderr: logger.error.bind(logger),
	};
	logger.log({
		config,
		frameworkSettings,
		buildCmd,
		serveCmd,
	});

	const needsFreshBuild = !(await canServeFromCache(config));

	// Build
	if (needsFreshBuild) {
		logger.log('Getting a fresh build...');
		// Start build process and get result
		const buildResult = await execAsyncWithCbs(
			buildCmd,
			undefined,
			{ cwd: config.projectRootFull },
			{
				...callbacks,
				receiveProc: (proc) => {
					global.RUNNING_PROCS!.build = proc;
				},
			}
		);
		global.RUNNING_PROCS!.build = undefined;
		// Cache build info
		const buildTime = new Date();
		const lastCommitSha = await getLastCommitSha(true, true, config.projectRootFull);
		const cacheData: PersistedData = {
			builtAt: buildTime.getTime(),
			buildDirName: config.buildDirFull,
			commitSha: lastCommitSha,
		};
		const cacheFilePath = await writeDataToFile(cacheData, config);
		logger.log(`Fresh build finished @${new Date()}`, {
			buildResult,
			cacheFilePath,
			cacheData,
		});
	} else {
		logger.log('Skipping build - serving from cache');
	}

	try {
		let serveRes: string;
		logger.log(`Starting serve command @${new Date()}`);
		if (serveCmd) {
			// Start serve process and await result
			serveRes = await execAsyncWithCbs(
				serveCmd,
				undefined,
				{ cwd: config.projectRootFull },
				{
					...callbacks,
					receiveProc: (proc) => {
						global.RUNNING_PROCS!.serve = proc;
					},
				}
			);
			// Exited
			global.RUNNING_PROCS!.serve = undefined;
		} else {
			// Fallback to serving with bundled serving dependency (must be executed from inside package)
			logger.warn(
				`Serve command was not specified. Using bundled server and build directory.`
			);
			serveCmd = `serve ${config.buildDirFull}`;

			serveRes = await execAsyncWithCbs(
				serveCmd,
				undefined,
				{ cwd: PackageRoot },
				{
					...callbacks,
					receiveProc: (proc) => {
						global.RUNNING_PROCS!.serve = proc;
					},
				}
			);
		}
	} catch (e) {
		logger.error(`Serving failed,`, e);
	}
}

export default main;
