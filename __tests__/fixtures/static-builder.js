#!/usr/bin/env node
// @ts-check
const fs = require('fs');

const checkVal = process.argv.slice(2)[0] || '';

const staticIndexHtml = `
<!DOCTYPE html>
<html>
<head>
	<meta charset='utf-8'>
	<meta http-equiv='X-UA-Compatible' content='IE=edge'>
	<title>Sample Static Build Index</title>
	<meta name='viewport' content='width=device-width, initial-scale=1'>
</head>
<body>
	<h1>Hello from Static Build Output!</h1>
	<h2>CHECK_VAL=${checkVal}||END_CHECK_VAL</h2>
</body>
</html>
`;

const buildDir = `${__dirname}/build`;
if (!fs.existsSync(buildDir)) {
	fs.mkdirSync(buildDir);
}
fs.writeFileSync(`${buildDir}/index.html`, staticIndexHtml);
fs.writeFileSync(`${buildDir}/checkVal.txt`, checkVal);
process.exit(0);
