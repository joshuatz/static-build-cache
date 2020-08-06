export interface FrameworkSetting {
	name: string;
	buildDirName: string;
	buildCmd: string;
	hasPackageJson: boolean;
	serveCmd?: string;
}

export interface Config {
	projectRoot: string;
	projectRootFull: string;
	buildDir: string;
	buildDirFull: string;
	buildCmd?: string;
	useGit: boolean;
	silent: boolean;
	cacheFileName?: string;
	serveCmd?: string;
}

export type MinConfig = Partial<Config> & Pick<Config, 'projectRoot'>;

export interface PersistedData {
	builtAt: number;
	commitSha?: string;
	buildDirName?: string;
}
