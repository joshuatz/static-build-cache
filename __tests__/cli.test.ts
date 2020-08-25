import test from 'ava';
import { ChildProcessWithoutNullStreams } from 'child_process';
import fse from 'fs-extra';
import { nanoid } from 'nanoid';
import treeKill from 'tree-kill';
import logger from '../src/logger';
import { execAsyncWithCbs, posixNormalize } from '../src/utilities';
import {
	checkServerResponse,
	getTestRunDir,
	scaffoldNodeProject,
	StaticTesterScripts,
} from './utils';

// How to call CLI
let testRunDirPath: string;
// We need to add binaries under local /node_modules to env, so we can use ts-node from anywhere
const LOCAL_BIN_PATH = posixNormalize(`${__dirname}/../node_modules/.bin`);
const ENV_WITH_LOCAL_BIN: NodeJS.ProcessEnv = {
	...process.env,
	path: `${process.env.path};${LOCAL_BIN_PATH}`,
};
const CLI_CALL_PATH = posixNormalize(`${__dirname}/../src/cli.ts`);
const CLI_CMD_BASE = `ts-node --transpile-only ${CLI_CALL_PATH}`;

// Use a different port than main.test.ts to avoid async conflict
const TEST_PORT = 3001;

test.before(async () => {
	testRunDirPath = await getTestRunDir();
});

test('Full run via CLI', async (t) => {
	// Scaffold
	const checkVal = nanoid(10);
	const { folderPath } = await scaffoldNodeProject({
		scripts: {
			build: `${StaticTesterScripts.build} ${checkVal}`,
		},
		copyUtils: true,
		containerDir: testRunDirPath,
	});

	// Spawn shell for use, catch server start
	// Give extra time to load up, due to ts-node
	t.timeout(1000 * 30, 'Extra time given for ts-node transpiling');
	let childProc: ChildProcessWithoutNullStreams;
	await new Promise((res, rej) => {
		execAsyncWithCbs(
			`${CLI_CMD_BASE}`,
			[`--servePort`, `${TEST_PORT}`, `--verbose`],
			{
				cwd: folderPath,
				env: ENV_WITH_LOCAL_BIN,
			},
			{
				stdout: (str) => {
					if (/serving from .+ started/i.test(str)) {
						// Server is up!
						res(str);
					}
				},
				onError: rej,
				receiveProc: (proc) => {
					childProc = proc;
				},
			},
			false
		);
	});

	// Check local server via GET
	t.truthy(await checkServerResponse(checkVal, TEST_PORT));

	// Stop server, *try* not to leave in detached state for concurrent tests
	/**
	 * NOTE: Shutting down the server *reliably* and passing
	 * events like SIGINT through, when going throw spawned shells
	 * (especially in this convuluted test setup)
	 * is proving extremely tricky. Using treeKill / killing by PID
	 * usually works, but occasionally fails to kill
	 * both the spawned shell AND the process (my program) that
	 * are running inside it.
	 */
	await new Promise((res, rej) => {
		treeKill(childProc.pid, 'SIGINT', (err) => {
			if (err) {
				rej(err);
			} else {
				res();
			}
		});
	});

	// Check if server went down
	// Don't fail test if still up - just note
	if (await checkServerResponse(checkVal, TEST_PORT)) {
		logger.warn(`Server is up at :${TEST_PORT}`);
	}
});

test.after.always(async () => {
	await fse.remove(testRunDirPath);
});
