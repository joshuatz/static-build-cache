import { execSync } from 'child_process';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import os from 'os';
import { sep } from 'path';
import { PackageJson } from 'type-fest';
import logger from '../../src/logger';
import { getLastCommitSha, posixNormalize } from '../../src/utilities';

export const utilsDir = `${__dirname}/../fixtures`;

export const utilFileNames = [`static-build-check.js`, `static-builder.js`];

export const getTestRunDir = async (): Promise<string> => {
	return await fse.mkdtemp(`${os.tmpdir()}${sep}`);
};

/**
 * Scaffold a typical NodeJS project, with `package.json`
 * @param options project options
 * @returns {Promise<string>} packagePath
 */
export const scaffoldNodeProject = async (options: {
	projectName?: string;
	projectSuffix?: string;
	scripts?: Record<string, string>;
	containerDir?: string;
	copyUtils?: boolean;
}) => {
	let { projectName, scripts, containerDir, copyUtils, projectSuffix } = options;
	const testDir: string = containerDir || (await getTestRunDir());

	if (!projectName) {
		projectSuffix = projectSuffix || 'node-project-';
		// Create a random project name
		projectName = `${projectSuffix}-${getRandStr(10)}`;
		// Avoid collision for folder to be created
		if (await fse.pathExists(posixNormalize(`${testDir}/${projectName}`))) {
			projectName = `${projectSuffix}-${getRandStr(10)}`;
		}
	}

	const folderPath = posixNormalize(`${testDir}/${projectName}`);
	const packageInfo: PackageJson = {
		name: projectName,
		scripts: scripts || {},
	};
	await fse.mkdirp(folderPath);
	const packagePath = await createPackageFile(folderPath, JSON.stringify(packageInfo));

	if (copyUtils) {
		const copyPromises = utilFileNames.map((utilFileName) => {
			return fse.copyFile(`${utilsDir}/${utilFileName}`, `${folderPath}/${utilFileName}`);
		});
		await Promise.all(copyPromises);
	}

	return {
		packagePath,
		folderPath,
	};
};

export const createPackageFile = async (folderPath: string, fileContents: string) => {
	const packagePath = `${folderPath}/package.json`;
	await fse.writeFile(packagePath, fileContents);
	return packagePath;
};

export const createGitCommit = async (
	repoDir: string,
	message?: string,
	forceInit = false
) => {
	const shas = {
		short: '',
		long: '',
	};
	message = message || new Date().getTime().toString();
	try {
		execSync(`git status`, { cwd: repoDir });
	} catch (e) {
		forceInit = true;
	}

	if (forceInit) {
		logger.warn(`Git not found in ${repoDir}, initializing now.`);
		execSync(`git init`, { cwd: repoDir });
	}

	execSync(`git commit --allow-empty -m "${message}"`, { cwd: repoDir });
	shas.long = await getLastCommitSha(true, false, repoDir);
	shas.short = await getLastCommitSha(false, false, repoDir);
	return { shas };
};

export const checkServerResponse = async (expectedVal: string, port = 3000) => {
	let foundVal;

	// Make GET to local server
	try {
		const res = await fetch(`http://localhost:${port}`, {});
		const html = await res.text();

		// Extract value
		const checkPatt = /CHECK_VAL=(.+)\|\|END_CHECK_VAL/i;
		const matches = checkPatt.exec(html);
		if (matches && matches.length) {
			foundVal = matches[1];
		}
	} catch (e) {
		return false;
	}

	return foundVal === expectedVal;
};

export const getRandStr = (len: number) => {
	return Array(len)
		.fill(0)
		.map(() => Math.random().toString(36).charAt(2))
		.join('');
};

export const StaticTesterScripts: PackageJson['scripts'] = {
	build: 'node static-builder.js',
	serve: 'node static-build-check.js',
};
