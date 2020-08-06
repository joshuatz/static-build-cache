import { FrameworkSetting } from './types';
import { posixNormalize } from './utilities';

export const BuildCmds = {
	likely: ['build-prod', 'build', 'dist', 'build:browser'],
	warn: ['production'],
};

export const ServeCmds = {
	likely: ['serve', 'server', 'host'],
};

export type UnderstoodFrameworks = 'react' | 'vue';

export const FrameworkDefaults: Record<UnderstoodFrameworks, FrameworkSetting> = {
	react: {
		buildCmd: 'build',
		buildDirName: 'build',
		serveCmd: 'serve',
		name: 'React',
		hasPackageJson: true,
	},
	vue: {
		buildCmd: 'build',
		buildDirName: 'dist',
		serveCmd: 'serve',
		name: 'Vue',
		hasPackageJson: true,
	},
};

export const CacheFileName = '.glitch-cache-meta';

/**
 * Package root - no trailing slash
 */
export const PackageRoot = posixNormalize(`${__dirname}/..`);
