"use strict";

var issueScore = require('../lib/issue-score.js');
var expect = require('expect.js');
var sinon = require('sinon');

describe('Issue Score', function () {

  it('should initialize when given a repository string', function () {
    var issueSkore = issueScore('claydiffrient/classroom-questions');
    expect(issueSkore.apiUrl).to.be('https://api.github.com/repos/claydiffrient/classroom-questions/issues/events?per_page=100');
  });

  xit('should pull in github credentials from a config file if present', function () {});



});
