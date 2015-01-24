#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var IssueScore = require('../lib/issue-score');

if (argv._.length !== 1) {
  console.log('Usage: issue-score {user/org}/{repository}');
  process.exit(1);
}

try {
  var issueScore = new IssueScore(argv._[0]);
  issueScore.fetch(function () {
    'use strict';
    console.log(issueScore.calculate().toString());
  });

} catch (err) {
  console.log('ERROR: ' + err.message);
  process.exit(1);
}

