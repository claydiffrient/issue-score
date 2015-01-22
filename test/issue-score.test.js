"use strict";

var IssueScore = require('../lib/issueScoreRedux.js');
var expect = require('expect.js');
var sinon = require('sinon');

describe('Issue Score', function () {

  describe('Constructor', function () {
    it('should throw an error if not given a properly formatted repo', function () {
      expect(function () {IssueScore('notright')}).to.throwError();
    });

    it('should throw an error if called with only the first part of the repo', function () {
      expect(function () {IssueScore('notokayeither/')}).to.throwError();
    });

    it('should throw an error if called with only the last part of the repo', function () {
      expect(function () {IssueScore('/notokayeither')}).to.throwError();
    });

    it('should throw an error if called with no arguments', function () {
      expect(function () {IssueScore()}).to.throwError();
    });

    it('should throw an error if called with a blank string', function () {
      expect(function () {IssueScore('')}).to.throwError();
    });

    it('should throw an error if called with a whitespace string', function () {
      expect(function () {IssueScore('      ')}).to.throwError();
    });

    it('should not throw an error when given a proper repository', function () {
      expect(function () {IssueScore('test/repo')}).to.not.throwError();
    });

    it('should properly split the repository string', function () {
      var issueScore = new IssueScore('testing/special');
      expect(issueScore.repository).to.be.ok();
      expect(issueScore.repository.user).to.be('testing');
      expect(issueScore.repository.repo).to.be('special');
    })
  });


  describe('calculate', function () {

    var issueData = [{
      actor: {
        login: 'testUser'
      },
      event: 'closed'
    },{
      actor: {
        login: 'testUser'
      },
      event: 'labeled'
    }];

    it('should calculate the issue scores given repository data', function () {
      var issueScore = new IssueScore('test/repo');
      var fetchStub = sinon.stub(issueScore, 'fetch', function (callback) {
        this.issueEvents = issueData;
        callback();
      });


      issueScore.fetch(function () {
        var scoreTable = issueScore.calculate();
        expect(scoreTable).to.be.ok();
        expect(scoreTable[0].testUser).to.eql([105, 1, 1]);
        expect(scoreTable.options.head).to.eql(['', 'Issue Score', 'closed', 'labeled'])
      });


    })
  })

});
