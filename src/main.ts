import { detectFramework, execAsync } from './utilities';
export async function main(config: Config) {
	const frameworkSettings = await detectFramework(config.projectRoot);
	console.log(frameworkSettings);
	if (!frameworkSettings) {
		return;
	}

	// Build
	try {
		await execAsync();
	} catch (e) {
		//
	}
	
	// Serve
	try {
		if (frameworkSettings.serveCmd) {
			await execAsync();
		} else {
			await execAsync()
		}
	}
}

export default main;
