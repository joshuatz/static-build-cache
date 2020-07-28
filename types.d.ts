interface FrameworkSetting {
	name: string;
	buildDirName: string;
	buildCmd: string;
	serveCmd?: string;
}

interface Config {
	projectRoot: string;
	buildDirName: string;
	buildCmd: string;
	useGit: boolean;
	silent: boolean;
	cacheDirName?: string;
	serveCmd?: string;
}

interface PersistedData {
	built: number;
	commitSha?: string;
	buildDirName?: string;
}
