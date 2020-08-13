#!/usr/bin/env node
import { Command } from 'commander';
import detectIsOnGlitch from 'detect-is-on-glitch';
import { PackageJson } from 'type-fest';
import { main } from './main';
import { MinConfig } from './types';
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
	.option(`--skipDetection`, `Skip "is on glitch" detection`);

const cli = async () => {
	const isOnGlitch = await detectIsOnGlitch();
	if (program.skipDetection !== true && !isOnGlitch) {
		// Bail early, and allow chained commands to execute!
		if (!program.silent) {
			console.error('not on glitch');
		}
		process.exit(0);
	} else {
		program.parse(process.argv);
		const inputConfig: MinConfig = {
			projectRoot: program.projectRoot,
			buildDir: program.buildDir,
			buildCmd: program.buildCmd,
			serveCmd: program.serveCmd,
			useGit: program.useGit,
			cacheFileName: program.cacheFileName,
			silent: program.silent,
		};
		await main(inputConfig);
	}
};

cli();
