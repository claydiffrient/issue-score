// Not worried about too long of lines in this file.
/* jshint -W101 */

'use strict';

var IssueScore = require('../lib/issue-score.js');
var expect = require('expect.js');
var sinon = require('sinon');
var rewire = require('rewire');

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

  var singleIssueArray = [{
    actor: {
      login: 'testUser2'
    },
    event: 'labeled'
  }];

  var allEventTypes = [{
    actor: {
      login: 'testUser2'
    },
    event: 'closed'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'merged'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'reopened'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'subscribed'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'referenced'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'assigned'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'labeled'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'milestoned'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'unassigned'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'unlabeled'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'demilestoned'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'renamed'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'locked'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'mentioned'
  },{
    actor: {
      login: 'testUser2'
    },
    event: 'something not handled'
  }];

  issueData.meta = singleIssueArray.meta = {
    link: '<https://nextUrl>; rel="next", <https://lastUrl>; rel="last"'
  };

  describe('Constructor', function () {
    it('should throw an error if not given a properly formatted repo', function () {
      expect(function () {new IssueScore('notright');}).to.throwError();
    });

    it('should throw an error if called with only the first part of the repo', function () {
      expect(function () {new IssueScore('notokayeither/');}).to.throwError();
    });

    it('should throw an error if called with only the last part of the repo', function () {
      expect(function () {new IssueScore('/notokayeither');}).to.throwError();
    });

    it('should throw an error if called with no arguments', function () {
      expect(function () {new IssueScore();}).to.throwError();
    });

    it('should throw an error if called with a blank string', function () {
      expect(function () {new IssueScore('');}).to.throwError();
    });

    it('should throw an error if called with a whitespace string', function () {
      expect(function () {new IssueScore('      ');}).to.throwError();
    });

    it('should not throw an error when given a proper repository', function () {
      expect(function () {new IssueScore('test/repo');}).to.not.throwError();
    });

    it('should properly split the repository string', function () {
      var issueScore = new IssueScore('testing/special');
      expect(issueScore.repository).to.be.ok();
      expect(issueScore.repository.user).to.be('testing');
      expect(issueScore.repository.repo).to.be('special');
    });
  });

  describe('authenticate', function () {
    var IssueScoreMock;
    var configMock;
    beforeEach(function () {
      IssueScoreMock = rewire('../lib/issue-score.js');
      configMock = {
        has: function () {
          return true;
        },
        get: function () {
          return 'test';
        }
      };
    });

    it('should use GitHub authentication if the configuration is present', function () {
      IssueScoreMock.__set__('config', configMock);
      var issueScore = new IssueScoreMock('testing/special');
      var githubSpy = sinon.spy(issueScore.github, 'authenticate');
      issueScore.fetch();
      expect(githubSpy.called).to.be.ok();
    });

    it('should not use it if the config is not present', function () {
      configMock.has = function () {
        return false;
      };
      IssueScoreMock.__set__('config', configMock);
      var issueScore = new IssueScoreMock('testing/special');
      var githubSpy = sinon.spy(issueScore.github, 'authenticate');
      issueScore.fetch();
      expect(!githubSpy.called).to.be.ok();
    });
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
        expect(scoreTable.options.head).to.eql(['', 'Issue Score', 'closed', 'labeled']);
      });
    });

    it('should handle all possible values for the event field', function () {
      var issueScore = new IssueScore('test/repo');
      var fetchStub = sinon.stub(issueScore, 'fetch', function (callback) {
        this.issueEvents = allEventTypes;
        callback();
      });


      issueScore.fetch(function () {
        var scoreTable = issueScore.calculate();
        expect(scoreTable).to.be.ok();
        expect(scoreTable[0].testUser2).to.eql([138, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        expect(scoreTable.options.head).to.eql(['', 'Issue Score', 'closed', 'merged', 'reopened',
          'subscribed', 'referenced', 'assigned', 'labeled', 'milestoned', 'unassigned', 'unlabeled',
          'demilestoned', 'renamed', 'locked', 'mentioned', 'something not handled']);
      });
    });

    it('should handle actor being null', function () {
      var issueScore = new IssueScore('test/repo');
      var nullIssueData = [{
        actor: null,
          event: 'reopened'
      }];
      var fetchStub = sinon.stub(issueScore, 'fetch', function (callback) {
        this.issueEvents = nullIssueData;
        callback();
      });


      issueScore.fetch(function () {
        var scoreTable = issueScore.calculate();
        expect(scoreTable).to.be.ok();
        expect(scoreTable[0].null).to.eql([-100, 1]);
        expect(scoreTable.options.head).to.eql(['', 'Issue Score', 'reopened']);
      });
    });

    describe('sort', function () {
      var A = { testUser1: [ 1000, 62, 3, 3, 0, 2, 1, 0, 0, 0, 0 ] };
      var B = { testUser2: [ 500, 4, 13, 13, 0, 0, 0, 0, 0, 0, 0 ] };
      it('should sort as expected', function () {
        var issueScore = new IssueScore('test/repo');
        var val = issueScore.sortFunc(A, B);
        expect(val).to.be(-500);
      });
    });
  });

  describe('fetch', function () {
    it('should throw an error if GitHub has issues', function () {
      var issueScore = new IssueScore('test/repo');
      var ghRepoStub = sinon.stub(issueScore.github.events, 'getFromRepoIssues').yields(true, null);
      issueScore.fetch(function (err){
        expect(err).to.be.ok();
      });
    });

    it('should get issues from github and add them to the data array', function () {
      var issueScore = new IssueScore('test/repo');
      var ghRepoStub = sinon.stub(issueScore.github.events, 'getFromRepoIssues').yields(null, issueData);
      var ghHasNextStub = sinon.stub(issueScore.github, 'hasNextPage');
      ghHasNextStub.onCall(0).returns(true);
      ghHasNextStub.onCall(1).returns(false);
      var ghGetNextPageStub = sinon.stub(issueScore.github, 'getNextPage');
      ghGetNextPageStub.onCall(0).yields(null, singleIssueArray);

      issueScore.fetch(function () {
        expect(issueScore.issueEvents).to.eql(issueData.concat(singleIssueArray));
      });
    });

    it('should throw an error if problems occur during the whilst loop', function () {
      var issueScore = new IssueScore('test/repo');
      var ghRepoStub = sinon.stub(issueScore.github.events, 'getFromRepoIssues').yields(null, issueData);
      var ghHasNextStub = sinon.stub(issueScore.github, 'hasNextPage').returns(true);
      var ghGetNextPageStub = sinon.stub(issueScore.github, 'getNextPage').yields(new Error('test'), singleIssueArray);
      issueScore.fetch(function (err){
        expect(err).to.be.ok();
      });
    });

  });

});
