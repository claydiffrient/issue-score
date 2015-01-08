"use strict";

var issueScore = require('../lib/issue-score.js');
var expect = require('expect.js');
var sinon = require('sinon');

describe('Issue Score', function () {

  it('should throw an error if not given a properly formatted repo', function () {
    expect(function () {issueScore('notright')}).to.throwError();
  });

  it('should throw an error if called with only the first part of the repo', function () {
    expect(function () {issueScore('notokayeither/')}).to.throwError();
  });

  it('should throw an error if called with only the last part of the repo', function () {
    expect(function () {issueScore('/notokayeither')}).to.throwError();
  });

  it('should throw an error if called with no arguments', function () {
    expect(function () {issueScore()}).to.throwError();
  });

  it('should throw an error if called with a blank string', function () {
    expect(function () {issueScore('')}).to.throwError();
  });

  it('should throw an error if called with a whitespace string', function () {
    expect(function () {issueScore('      ')}).to.throwError();
  });

  it('should not throw an error when given a proper repository', function () {
    expect(function () {issueScore('test/repo')}).to.not.throwError();
  })

  xdescribe('calculate', function () {
    it('should calculate the issue scores given repository data', function () {
      var issueScore = issueScore('test/repo');
      //TODO: Add mock data here.
      var data = {};
      var scoreTable = issueScore.calculate(data)
      expect(scoreTable).to.be.ok();
    })
  })

});
