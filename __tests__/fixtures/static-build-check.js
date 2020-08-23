#!/usr/bin/env node
// @ts-check
const fs = require('fs');
const fileCheck = `${__dirname}/build/index.html`;

if (fs.existsSync(fileCheck)) {
	process.exit(0);
}

process.exit(1);
