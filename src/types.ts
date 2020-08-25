export interface PipelineSetting {
	frameworkName: string;
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
	verbose: boolean;
	cacheFileName?: string;
	serveCmd?: string;
	servePort: number;
}

export type MinConfig = Partial<Config>;

export interface PersistedData {
	builtAt: number;
	commitSha?: string;
	buildDirName?: string;
}

export type UnpackedPromise<T> = T extends Promise<infer U> ? U : T;
