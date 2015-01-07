#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var issueScore = require('../lib/issue-score');

if (argv._.length != 1) {
  console.log("Usage: issue-score {user/org}/{repository}");
  process.exit(1);
}

try {
  issueScore(argv._[0]);
} catch (err) {
  console.log("ERROR: " + err.message)
  process.exit(1);
}

