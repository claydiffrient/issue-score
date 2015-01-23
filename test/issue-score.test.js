"use strict";

var IssueScore = require('../lib/issueScoreRedux.js');
var expect = require('expect.js');
var sinon = require('sinon');

describe('Issue Score', function () {

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
    });
  });

  describe('fetch', function () {
    it('should throw an error if GitHub has issues', function () {
      var issueScore = new IssueScore('test/repo');
      var ghRepoStub = sinon.stub(issueScore.github.events, 'getFromRepoIssues').yields(true, null);
      expect(function () {
        issueScore.fetch({}, function (err, data){});
      }).to.throwError();
    });

    it('should get issues from github and add them to the data array', function () {
      var singleIssueArray = [{
        actor: {
          login: 'testUser2'
        },
        event: 'labeled'
      }];
      issueData.meta = singleIssueArray.meta = {
        link: '<https://nextUrl>; rel="next", <https://lastUrl>; rel="last"'
      };
      var issueScore = new IssueScore('test/repo');
      var ghRepoStub = sinon.stub(issueScore.github.events, 'getFromRepoIssues').yields(null, issueData);
      var ghHasNextStub = sinon.stub(issueScore.github, 'hasNextPage')
      ghHasNextStub.onCall(0).returns(true);
      ghHasNextStub.onCall(1).returns(false);
      var ghGetNextPageStub = sinon.stub(issueScore.github, 'getNextPage');
      // ghGetNextPageStub.onCall(0).yields(null, issueData);
      ghGetNextPageStub.onCall(0).yields(null, singleIssueArray);

      issueScore.fetch(function () {
        expect(issueScore.issueEvents).to.eql(issueData.concat(singleIssueArray));
      });
    });
  })

});



[ { actor: { login: 'testUser' }, event: 'closed' },
  { actor: { login: 'testUser' }, event: 'labeled' },
  { actor: { login: 'testUser' }, event: 'closed' },
  { actor: { login: 'testUser' }, event: 'labeled' } ]


[ { actor: { login: 'testUser' }, event: 'closed' },
  { actor: { login: 'testUser' }, event: 'labeled' },
  { actor: { login: 'testUser2' }, event: 'labeled' } ]