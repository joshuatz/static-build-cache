import { PipelineSetting } from './types';

export const BuildCmds = {
	likely: ['build-prod', 'build', 'dist', 'build:browser'],
	warn: ['production'],
};

export const ServeCmds = {
	likely: ['serve', 'server', 'host'],
};

export type UnderstoodFrameworks = 'react' | 'vue';

export const FrameworkDefaults: Record<UnderstoodFrameworks, PipelineSetting> = {
	react: {
		buildCmd: 'build',
		buildDirName: 'build',
		serveCmd: 'serve',
		frameworkName: 'React',
		hasPackageJson: true,
	},
	vue: {
		buildCmd: 'build',
		buildDirName: 'dist',
		serveCmd: 'serve',
		frameworkName: 'Vue',
		hasPackageJson: true,
	},
};

export const CacheFileName = '.static-build-cache-meta';
export const NonGitCacheDurationMs = 1000 * 60 * 60;
