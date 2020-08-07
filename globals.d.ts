import { ChildProcess } from 'child_process';

declare global {
	declare namespace NodeJS {
		interface Global {
			IS_CLI?: boolean;
			RUNNING_PROCS?: {
				serve?: ChildProcess;
				build?: ChildProcess;
			};
		}
	}
}
