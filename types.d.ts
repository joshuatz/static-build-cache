interface FrameworkSetting {
	name: string;
	buildDirName: string;
	buildCmd: string;
	hasPackageJson: boolean;
	serveCmd?: string;
}

interface Config {
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

interface PersistedData {
	builtAt: number;
	commitSha?: string;
	buildDirName?: string;
}
