#!/usr/bin/env node
import { Command } from 'commander';
import { PackageJson } from 'type-fest';
import { NotOnGlitchErrorMsg } from './constants';
import { main } from './main';
import { MinConfig } from './types';
import detectIsOnGlitch = require('detect-is-on-glitch');
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
const program = new Command();
program
	.version(packageInfo.version!)
	.name(packageInfo.name!)
	.option(`-p, --projectRoot <directoryStr>`, `App root directory`)
	.option(`-o, --buildDir <directoryStr>`, `App build directory`)
	.option(`-b, --buildCmd <commandStr>`, `Command string to trigger build`)
	.option(`-s, --serveCmd <commandStr>`, `Command string to trigger "serving"`)
	.option(`-g, --useGit`, `Use git log to allow rebuilds`)
	.option(
		`--cacheFileName <desiredName>`,
		`Specify the file name you would like for the cache`
	)
	.option(`-s, --silent`, `Suppress logging`)
	.option(`--skipDetection`, `Skip "is on glitch" detection`)
	.option(`-p, --port <portNum>`, `Port for serving`);

const cli = async () => {
	program.parse(process.argv);
	const isOnGlitch = await detectIsOnGlitch();
	if (program.skipDetection !== true && !isOnGlitch) {
		// Bail early, and allow chained commands to execute!
		if (!program.silent) {
			console.error(NotOnGlitchErrorMsg);
		}
		process.exit(0);
	} else {
		const inputConfig: MinConfig = {
			projectRoot: program.projectRoot,
			buildDir: program.buildDir,
			buildCmd: program.buildCmd,
			serveCmd: program.serveCmd,
			servePort: parseInt(program.port, 10),
			useGit: program.useGit,
			cacheFileName: program.cacheFileName,
			silent: program.silent,
		};
		await main(inputConfig);
	}
};

cli();
