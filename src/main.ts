import { canServeFromCache, writeDataToFile } from './cache';
import { processConfig } from './config';
import { PackageRoot } from './constants';
import Logger from './logger';
import { MinConfig } from './types';
import { detectFramework, execAsyncWithCbs, getLastCommitSha } from './utilities';

export async function main(inputConfig: MinConfig) {
	const config = await processConfig(inputConfig);
	const logger = new Logger(config);
	const frameworkSettings = await detectFramework(config);

	if (!frameworkSettings) {
		return;
	}

	// Compute final commands
	const buildCmd = config.buildCmd || frameworkSettings.buildCmd;
	let serveCmd = config.serveCmd || frameworkSettings.serveCmd;
	const callbacks = {
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
		const buildResult = await execAsyncWithCbs(
			buildCmd,
			undefined,
			{ cwd: config.projectRootFull },
			callbacks
		);
		// Cache build info
		const buildTime = new Date();
		const cacheFilePath = await writeDataToFile(
			{
				builtAt: buildTime.getTime(),
				buildDirName: config.buildDirFull,
				commitSha: await getLastCommitSha(true, true),
			},
			config
		);
		logger.log(`Fresh build finished @${new Date()}`, {
			buildResult,
			cacheFilePath,
		});
	} else {
		logger.log('Skipping build - serving from cache');
	}

	try {
		let serveRes: string;
		logger.log(`Starting serve command @${new Date()}`);
		if (serveCmd) {
			serveRes = await execAsyncWithCbs(
				serveCmd,
				undefined,
				{ cwd: config.projectRootFull },
				callbacks
			);
		} else {
			// Fallback to serving with bundled serving dependency (must be exected from inside package)
			logger.warn(
				`Serve command was not specified. Using bundled server and build directory.`
			);
			serveCmd = `serve ${config.buildDirFull}`;

			serveRes = await execAsyncWithCbs(
				serveCmd,
				undefined,
				{ cwd: PackageRoot },
				callbacks
			);
		}
	} catch (e) {
		logger.error(`Serving failed,`, e);
	}
}

export default main;
