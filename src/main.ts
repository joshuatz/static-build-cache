import LocalWebServer = require('local-web-server');
import { canServeFromCache, writeDataToFile } from './cache';
import { processConfig } from './config';
import { logger, verboseLogger } from './logger';
import { MinConfig, PersistedData } from './types';
import {
	detectPipeline,
	execAsyncWithCbs,
	exitProgram,
	getLastCommitSha,
	stopProgram,
} from './utilities';

// Catch SIGINT (or other close request) and close out program
[
	`SIGINT`,
	`exit`,
	`SIGUSR1`,
	`SIGUSR2`,
	`uncaughtException`,
	`SIGTERM`,
	`SIGHUP`,
].forEach((eventType) => {
	process.on(eventType, exitProgram);
});
process.on('message', (msg) => {
	if (msg && msg.action === 'STOP') {
		exitProgram();
	}
});

export async function main(inputConfig: MinConfig) {
	const config = await processConfig(inputConfig);
	const pipelineSettings = await detectPipeline(config);
	global.RUNNING_PROCS = {
		serve: undefined,
		build: undefined,
	};

	if (!pipelineSettings) {
		return;
	}

	// Compute final commands
	const buildCmd = config.buildCmd || pipelineSettings.buildCmd;
	let serveCmd = config.serveCmd || pipelineSettings.serveCmd;
	const callbacks: Parameters<typeof execAsyncWithCbs>[3] = {
		stdout: logger.log.bind(logger),
		stderr: logger.error.bind(logger),
	};

	const cacheResult = await canServeFromCache(config);
	const needsFreshBuild = !cacheResult.canServe;

	// Build
	if (needsFreshBuild) {
		logger.log('Getting a fresh build...', cacheResult.reason);
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
		verboseLogger.log(`Fresh build finished @${new Date()}`, {
			buildResult,
			cacheFilePath,
			cacheData,
		});
	} else {
		logger.log('Skipping build - serving from cache', cacheResult.reason);
	}

	try {
		let serveResOutput: string;
		const onServeDone = (output: string) => {
			// Exited!
			serveResOutput = output;
			global.RUNNING_PROCS!.serve = undefined;
		};
		logger.log(
			`Starting serve command @${new Date()}${serveCmd ? `: ${serveCmd}` : ''}`
		);
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
			verboseLogger.warn(
				`Serve command was not specified. Using bundled local server and build directory, on port ${config.servePort}`
			);

			const ws = LocalWebServer.create({
				port: config.servePort,
				directory: config.buildDirFull,
			});
			global.SERVER = ws.server;

			// Catch server-up
			ws.server.on('listening', () => {
				logger.log(
					`Serving from http://localhost:${
						config.servePort
					} started @${new Date()}`
				);
			});
		}
	} catch (e) {
		logger.error(`Serving failed,`, e);
	}

	// Return some control methods
	/* istanbul ignore next */
	return {
		forceExit: async () => {
			verboseLogger.log(`Force exiting!`);
			await exitProgram();
		},
		forceStop: async () => {
			verboseLogger.log(`Force stopping!`);
			await stopProgram();
		},
	};
}

export default main;
