import test from 'ava';
import fse from 'fs-extra';
import { PackageJson } from 'type-fest';
import { main } from '../src/main';
import { createGitCommit, getTestRunDir, scaffoldNodeProject } from './helpers';

let testRunDirPath: string;

const CLEANUP = false;

const tmpDirPaths: string[] = [];

const TypicalCRAScripts: PackageJson['scripts'] = {
	start: 'react-scripts start',
	build: 'react-scripts build',
	eject: 'react-scripts eject',
};

const StaticTesterScripts: PackageJson['scripts'] = {
	build: 'node static-builder.js',
	serve: 'node static-build-check.js',
};
/*
test('Tests typical Creact-React-App starter', async (t) => {
	const { folderPath } = await scaffoldNodeProject({
		projectName: 'cra-typical',
		scripts: TypicalCRAScripts,
	});
	// Create a git commit
	await createGitCommit(folderPath);
	// Run program
});
**/

test.before(async () => {
	testRunDirPath = await getTestRunDir();
});

test(`Tests simple static build and serve project`, async (t) => {
	const { folderPath } = await scaffoldNodeProject({
		projectName: 'simple-static',
		scripts: StaticTesterScripts,
		copyUtils: true,
		containerDir: testRunDirPath,
	});
	console.log({
		testRunDirPath,
		folderPath,
	});
	// Create a git commit
	await createGitCommit(folderPath);
	// Run program
	const runner = await main({
		projectRoot: folderPath,
	});
	t.truthy(typeof runner.forceExit === 'function');
});

test.after.always(async () => {
	if (CLEANUP) {
		await fse.remove(testRunDirPath);
		await Promise.all(tmpDirPaths.map((p) => fse.remove(p)));
	}
});
