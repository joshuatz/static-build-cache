#!/usr/bin/env node
import { Command } from 'commander';
import detectIsOnGlitch from 'detect-is-on-glitch';
import { PackageJson } from 'type-fest';
import * as PackageRaw from '../package.json';
import { main } from './main';

const callingDir = process.cwd();
const packageInfo: PackageJson = PackageRaw;

/**
 * Setup Commander CLI Helper
 */
const program = new Command();
program
	.version(packageInfo.version!)
	.name(packageInfo.name!)
	.option(`-m, --mainDir <directoryStr>`, `App root directory`)
	.option(`-o, --buildDir <directoryStr>`, `App build directory`)
	.option(`-b, --buildCmd <commandStr>`, `Command string to trigger build`)
	.option(`-s, --serveCmd <commandStr>`, `Command string to trigger "serving"`)
	.option(`-g, --useGit`, `Use git log to allow rebuilds`)
	.option(
		`--cacheDirName <desiredName>`,
		`Specify the folder name you would like for the cache`
	)
	.option(`-s, --silent`, `Suppress logging`);

const cli = async () => {
	const isOnGlitch = await detectIsOnGlitch();
	if (!isOnGlitch) {
		// Bail early, and allow chained commands to execute!
		console.log('not on glitch');
		process.exit(0);
	} else {
		program.parse(process.argv);
		await main(callingDir);
		// We need to exit, but not allow any chained commands (e.g. `start`) to run
	}
};

cli();
