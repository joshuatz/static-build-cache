# Static-Build-Cache
![NodeJS CI Passing Status Badge](https://github.com/joshuatz/static-build-cache/workflows/Node.js%20CI/badge.svg) [![Code Coverage Badge](https://codecov.io/gh/joshuatz/static-build-cache/branch/main/graph/badge.svg)](https://codecov.io/gh/joshuatz/static-build-cache/branch/main) ![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/joshuatz/static-build-cache) [![NPM Badge](https://img.shields.io/npm/v/static-build-cache)](https://www.npmjs.com/package/static-build-cache)

> This is a tool meant to help avoid redundant builds for projects that use a typical "build and serve" pipeline for static content. E.g. projects that use React without a backend, Gatsby, docs, etc.

This tool was originally created to speed up the serve process on a Create-React-App based project on Glitch. The typical "build and serve" approach, using `package.json` scripts, might look like:

```sh
npm run build && npm run serve
```

...but there is a big issue with the above workflow. It compiles / creates a fresh build, *every*, *single*, *time*. When your build system has access to git and *should* know if things have actually changed, does this make sense to do? Not to me.

So I created this. Instead of calling `build && serve`, you call this tool, and it will check if a fresh build is necessary based on the last git commit. If so, it will run your build command before serving, otherwise go straight to serving.

## Side-note
A tool similar to this one *probably* exists somewhere out there already. Regardless, this was a fun learning experience for me, and fits my needs.

## Installation
@TODO: Publish on NPM and provide link

## Usage

You can either call this via the CLI (exposed through `.bin` as `static-build-cache`), or via standard JS modules.

> A large goal of this tool is to provide as much of a config-free experience as possible. For many static apps, you can use it without passing *any* options at all! ✨

Options:

Full (CLI + JS) | Short | Default | Description
--- | --- | --- | ---
`--projectRoot` | `-d` | `.` / caller dir | Project root directory (where `package.json` can be found)
`--buildDir` | `-o` | `./build` | Where build files are emitted
`--buildCmd` | `-b` | Depends. Tries to detect from your `package.json` automatically, and/or framework. | What command to execute to produce a build
`--serveCmd` | `-s` | Depends. Tries to detect from your `package.json`. Falls back to bundled server ([`local-web-server`](https://www.npmjs.com/package/local-web-server)). | What command to use to serve `./build`.
`--useGit` | `-g` | `true` | Use git to decide whether or not a fresh build is necessary. This is 99% of why this tool is useful, so does not make much sense to have as `false`.
`--cacheFileName` | NA | `.static-build-cache-meta` | Filename to use for the file which will record build info
`--silent` | `-s` | `false` | Suppress stdout messages. If you disable it, you might miss info about serving...
`--verbose` | `-v` | `false` | Turn on *extra* logging.
`--servePort` | `-p` | `3000` | If using the built-in server, which port to serve on.

> For the config passed to `main()`, the same option keys are used as the CLI options, just without the `--`. 

### Usage Example
Package.json / CLI:

```json
{
	"scripts": {
		"build-and-serve": "static-build-cache"
	}
}
```

More advanced:
```json
{
	"scripts": {
		"my-serve": "... (something complicated)",
		"build-and-serve": "static-build-cache --serveCmd \"npm run my-serve\" -p 3001"
	}
}
```

ESM Module, with Async / Await:

```js
import {main} from 'static-build-cache';

const RUN_TIME_MINS = 2;

const limitedRun = async () => {
	const runner = await main({
		servePort: 3002
	});

	// Do something
	console.log(`Browse my site at http://localhost:3002. For only the next ${RUN_TIME_MINS} minutes!`);

	setTimeout(async () => {
		await runner.forceExit();
		console.log(`Server has been shut down!`);
	}, RUN_TIME_MINS * 1000 * 60);
};

limitedRun();
```


## Development
Most of the development environment is pretty standard. However, one important thing to note is that I'm not transpiling my tests (in TypeScript) to JS in advance; instead I'm using `ts-node` to transpile them (as-needed) when `ava` is called.

> I *highly* recommend using [yalc](https://www.npmjs.com/package/yalc) for local testing while developing. I left some yalc specific commands in my `package.scripts` section, which are helpful if you have it installed.

## Change Notes
Version | Date | Notes
--- | --- | ---
v0.1.0 | 8/25/2020 | Initial release! 🚀

## Known Issues
Currently, this tool relies exclusively on Git to track whether or not source code has changed. This means it will not properly cache the build folder outside of it. Theoretically, so that it could be used outside of any VC system, I could add code to track some sort of combined hash representing the file structure and contents of source code, and use that to determine changes.

## About Me:

 - 🔗<a href="https://joshuatz.com/" rel="noopener" target="_blank">joshuatz.com</a>
 - 💬<a href="https://twitter.com/1joshuatz" rel="noopener" target="_blank">@1joshuatz</a>
 - 💾<a href="https://github.com/joshuatz" rel="noopener" target="_blank">github.com/joshuatz</a>