import test from 'ava';
import fse from 'fs-extra';
import { nanoid } from 'nanoid';
import { CacheFileName } from '../src/constants';
import { main } from '../src/main';
import { PersistedData, UnpackedPromise } from '../src/types';
import { delay } from '../src/utilities';
import {
	checkServerResponse,
	createGitCommit,
	getTestRunDir,
	scaffoldNodeProject,
	StaticTesterScripts,
} from './utils';

let testRunDirPath: string;

const tmpDirPaths: string[] = [];
const activeRunners: Array<UnpackedPromise<ReturnType<typeof main>>> = [];

test.before(async () => {
	testRunDirPath = await getTestRunDir();
});

test(`Tests simple static build and serve project`, async (t) => {
	// Scaffold
	const checkVal = nanoid(10);
	const { folderPath } = await scaffoldNodeProject({
		scripts: {
			build: `${StaticTesterScripts.build} ${checkVal}`,
			serve: `${StaticTesterScripts.serve}`,
		},
		copyUtils: true,
		containerDir: testRunDirPath,
	});

	// Create a git commit
	await createGitCommit(folderPath);

	// Run program
	const runner = await main({
		projectRoot: folderPath,
	});
	activeRunners.push(runner);
	// Make sure that program executed correctly, complete with checkVal
	t.truthy(typeof runner.forceExit === 'function');
	t.truthy(typeof runner.forceStop === 'function');
	const foundVal: string = (
		await fse.readFile(`${folderPath}/build/checkVal.txt`)
	).toString();
	t.is(checkVal, foundVal);
});

test(`Tests built-in serve functionality, plus caching`, async (t) => {
	// Scaffold
	const checkVal = nanoid(10);
	const { folderPath } = await scaffoldNodeProject({
		projectSuffix: 'built-in-serve',
		scripts: {
			build: `${StaticTesterScripts.build} ${checkVal}`,
			// Omit `serve` entry to trigger auto-serve
		},
		copyUtils: true,
		containerDir: testRunDirPath,
	});
	const cacheFilePath = `${folderPath}/${CacheFileName}`;

	// Create a git commit
	const firstShas = (await createGitCommit(folderPath)).shas;
	const firstRunner = await main({
		projectRoot: folderPath,
	});

	// Give enough time for build command to run
	await delay(2000);

	// Shut down
	await firstRunner.forceStop();

	// Check cache
	let cacheData: PersistedData = fse.readJsonSync(cacheFilePath);
	t.true(typeof cacheData.commitSha === 'string');
	t.is(cacheData.commitSha, firstShas.long);

	// Create a new commit
	const secondShas = (await createGitCommit(folderPath)).shas;
	t.not(firstShas.long, secondShas.long);
	t.not(firstShas.short, secondShas.short);

	// Run again
	const secondRunner = await main({
		projectRoot: folderPath,
	});

	// Give enough time for build command to run
	await delay(2000);

	// Shut down
	await secondRunner.forceStop();

	// Check cache, make sure a FRESH build was used
	cacheData = fse.readJsonSync(cacheFilePath);
	t.is(cacheData.commitSha, secondShas.long);

	// Run again, but without a new commit
	// Build step should be skipped and go right to serve
	const runner = await main({
		projectRoot: folderPath,
	});
	activeRunners.push(runner);

	await delay(1000);
	const lastCacheData: PersistedData = fse.readJsonSync(cacheFilePath);
	t.is(cacheData.commitSha, lastCacheData.commitSha);
	t.is(cacheData.builtAt, lastCacheData.builtAt);

	// Perform a true `serve` test - GET to local server
	t.truthy(await checkServerResponse(checkVal));
});

test.after.always(async () => {
	await Promise.all(activeRunners.map((runner) => runner.forceStop()));
	await fse.remove(testRunDirPath);
	await Promise.all(tmpDirPaths.map((p) => fse.remove(p)));
});
