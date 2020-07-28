export const BuildCmds = {
	likely: ['build-prod', 'build', 'dist', 'build:browser'],
	warn: ['production'],
};

export const ServeCmds = {
	likely: ['serve', 'server', 'host'],
};

export type UnderstoodFrameworks = 'react' | 'vue';

export const FrameworkDefaults: Record<
	UnderstoodFrameworks,
	FrameworkSetting
> = {
	react: {
		buildCmd: 'build',
		buildDirName: 'build',
		serveCmd: 'serve',
		name: 'React',
	},
	vue: {
		buildCmd: 'build',
		buildDirName: 'dist',
		serveCmd: 'serve',
		name: 'Vue',
	},
};

export const CacheFileName = '.glitch-cache-meta';
