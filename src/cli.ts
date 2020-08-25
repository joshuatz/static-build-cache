#!/usr/bin/env node
import { Command } from 'commander';
import { PackageJson } from 'type-fest';
import { main } from './main';
import { MinConfig } from './types';
// @ts-ignore
const PackageRaw = require('../package.json');

const packageInfo: PackageJson = PackageRaw;

/**
 * Set GLOBAL flag
 */
global.IS_CLI = true;

/**
 * Setup Commander CLI Helper
 */

export const getProgram = () => {
	const program = new Command();
	program
		.version(packageInfo.version!)
		.name(packageInfo.name!)
		.option(`-d, --projectRoot <directoryStr>`, `App root directory`)
		.option(`-o, --buildDir <directoryStr>`, `App build directory`)
		.option(`-b, --buildCmd <commandStr>`, `Command string to trigger build`)
		.option(`-s, --serveCmd <commandStr>`, `Command string to trigger "serving"`)
		.option(`-g, --useGit`, `Use git log to allow rebuilds`)
		.option(
			`--cacheFileName <desiredName>`,
			`Specify the file name you would like for the cache`
		)
		.option(`-s, --silent`, `Suppress logging`)
		.option(`-v, --verbose`, `Turn on extra logging`)
		.option(`-p, --servePort <portNum>`, `Port for serving`);
	return program;
};

const cli = async () => {
	const program = getProgram();
	program.parse(process.argv);

	const inputConfig: MinConfig = {
		projectRoot: program.projectRoot,
		buildDir: program.buildDir,
		buildCmd: program.buildCmd,
		serveCmd: program.serveCmd,
		servePort: parseInt(program.servePort, 10),
		useGit: program.useGit,
		cacheFileName: program.cacheFileName,
		silent: program.silent,
		verbose: program.verbose,
	};

	await main(inputConfig);
};

// If called directly
if (require.main === module) {
	cli();
}
