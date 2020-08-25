declare namespace NodeJS {
	import { ChildProcess } from 'child_process';
	import { Server } from 'https';
	interface Global {
		IS_CLI?: boolean;
		RUNNING_PROCS?: {
			serve?: ChildProcess;
			build?: ChildProcess;
		};
		SERVER?: Server;
		SILENT?: boolean;
		VERBOSE?: boolean;
	}
}

declare module 'local-web-server' {
	import { Server } from 'https';
	export = class LocalWebServer {
		constructor();
		public static create(config?: LwsConfigMixed): LocalWebServer;
		public server: Server;
		public config: LwsConfigMixed;
		public _eventsCount: number;
	};
	type LwsConfigMixed = Partial<LwsConfig> & Partial<LwsConfigStatic>;
	// https://github.com/lwsjs/lws/blob/4e633cb9a394837572af1f85b30c77c5d4411487/lib/config.js
	interface LwsConfig {
		/**
		 * The port number to listen on.
		 */
		port: number;
		/**
		 * The hostname or IP address to bind to.
		 */
		hostname: string;
		maxConnections: number;
		keepAliveTimeout: number;
		/**
		 * Filename to retrieve stored config from. Defaults to "lws.config.js".
		 */
		configFile: string;
		/**
		 * Enable HTTPS using a built-in TLS certificate registered to the hosts 127.0.0.1 and localhost.
		 */
		https: boolean;
		/**
		 * Enable HTTP2 using a built-in TLS certificate registered to the hosts 127.0.0.1 and localhost.
		 */
		http2: boolean;
		/**
		 * Private key. Supply along with `cert` to launch a secure server.
		 */
		key: string;
		/**
		 * Certificate chain. Supply along with `key` to launch a secure server.
		 */
		cert: string;
		/**
		 * Optional PFX or PKCS12 encoded private key and certificate chain. An alternative to providing `key` and `cert`.
		 */
		pfx: string;
		/**
		 * Optional cipher suite specification, replacing the built-in default.
		 */
		ciphers: string;
		/**
		 * Optional SSL method to use.
		 */
		secureProtocol: string;
		/**
		 * Array of middleware classes, or filenames of modules exporting a middleware class.
		 */
		stack: string[];
		/**
		 * One or more directories to search for middleware modules.
		 */
		moduleDir: string | string[];
		/**
		 * An optional string to prefix to module names when loading middleware modules.
		 */
		modulePrefix: string;
		/**
		 * Custom view instance.
		 */
		view: string;
	}
	// https://github.com/lwsjs/static/blob/368a7ddc3c019ac2e853b28dc33549d78ce6e95d/index.js
	interface LwsConfigStatic {
		/**
		 * Root directory, defaults to the current directory.
		 */
		directory?: string;
		static?: {
			maxage?: number;
			defer?: boolean;
			/**
			 * Default file name, defaults to `index.html
			 */
			index?: string;
			extensions?: string[];
		};
	}
}
