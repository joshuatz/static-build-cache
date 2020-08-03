import { canServeFromCache } from './cache';
import { processConfig } from './config';
import { PackageRoot } from './constants';
import Logger from './logger';
import { detectFramework, execAsync } from './utilities';

export async function main(inputConfig: Partial<Config>) {
	const config = await processConfig(inputConfig);
	const logger = new Logger(config);
	const frameworkSettings = await detectFramework(config);

	if (!frameworkSettings) {
		return;
	}

	// Compute final commands
	const buildCmd = config.buildCmd || frameworkSettings.buildCmd;
	let serveCmd = config.serveCmd || frameworkSettings.serveCmd;
	logger.log({
		config,
		frameworkSettings,
		buildCmd,
		serveCmd,
	});

	// STOP
	// return PackageRoot;

	const needsFreshBuild = !(await canServeFromCache(config));
	logger.log({
		PackageRoot,
		needsFreshBuild,
	});

	// Build
	if (needsFreshBuild) {
		logger.log('Getting a fresh build...');
		const buildRes = await execAsync(buildCmd, { cwd: config.projectRootFull });
		logger.log(`Fresh build finished @${new Date()}`, buildRes);
	} else {
		logger.log('Skipping build - serving from cache');
	}

	try {
		let serveRes;
		logger.log(`Starting serve command @${new Date()}`);
		if (serveCmd) {
			serveRes = await execAsync(serveCmd, { cwd: config.projectRootFull });
		} else {
			// Fallback to serving with bundled serving dependency (must be exected from inside package)
			serveCmd = `serve ${config.buildDirFull}`;

			serveRes = await execAsync(serveCmd, { cwd: PackageRoot });
		}
		logger.log(serveRes);
	} catch (e) {
		logger.error(`Serving failed,`, e);
	}
}

export default main;
