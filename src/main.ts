import LocalWebServer = require('local-web-server');
import { canServeFromCache, writeDataToFile } from './cache';
import { processConfig } from './config';
import logger from './logger';
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
	global.SILENT = config.silent;
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
		let serveResOutput: string;
		const onServeDone = (output: string) => {
			// Exited!
			serveResOutput = output;
			global.RUNNING_PROCS!.serve = undefined;
		};
		logger.log(`Starting serve command @${new Date()}`);
		if (serveCmd) {
			// Start serve process
			execAsyncWithCbs(
				serveCmd,
				undefined,
				{ cwd: config.projectRootFull },
				{
					...callbacks,
					receiveProc: (proc) => {
						global.RUNNING_PROCS!.serve = proc;
					},
				},
				false
			).then(onServeDone);
		} else {
			// Fallback to serving with bundled serving dependency (must be executed from inside package)
			logger.warn(
				`Serve command was not specified. Using bundled server and build directory.`
			);

			const PORT = 3000;
			const ws = LocalWebServer.create({
				port: PORT,
				directory: config.buildDirFull,
			});
			global.SERVER = ws.server;

			// Catch server-up
			ws.server.on('listening', () => {
				logger.log(`Serving from http://localhost:${PORT} started @${new Date()}`);
			});
		}
	} catch (e) {
		logger.error(`Serving failed,`, e);
	}

	// Return some control methods
	return {
		forceExit: () => {
			logger.log(`Force exiting!`);
			exitProgram();
		},
	};
}

export default main;
