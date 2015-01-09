var _ = require('lodash');
var GitHubAPI = require('github');
var config = require('config');
var async = require('async');
var Table = require('cli-table');
var Spinner = require('clui').Spinner;

function IssueScore(repository) {

  var repoRegex = /\S+\/\S+/;

  if (!repository) {
    throw new Error('Invalid repository, should be "user/repo"');
  }

  if (!repoRegex.test(repository)) {
    throw new Error('Invalid repository, should be "user/repo"');
  }

  var splitRepo = repository.split('/')
  this.repository = {};
  this.repository.user = splitRepo[0];
  this.repository.repo = splitRepo[1];

  this.issueEvents = [];
  this.reportingTable = [];

  this.github = new GitHubAPI({
    version: '3.0.0',
    protocol: 'https',
    timeout: 5000,
    headers: {
      'User-Agent': config.get('GitHub.userAgent')
      }
    });

  if (config.has('GitHub.username') && config.has('GitHub.password')) {
    github.authenticate({
      type: 'basic',
      username: config.get('GitHub.username'),
      password: config.get('GitHub.password')
    });
  }

};

IssueScore.prototype.fetch = function(callback) {
  var that = this;
  var initialMsg = {
    user: repoUser,
    repo: repoName,
    per_page: 100
  };

  var count = 0;
  github.events.getFromRepoIssues(initialMsg, function (err, data) {
    if (err) {
      throw new Error('Problem getting events from repo', err);
    } else {
      that.issueEvents = that.issueEvents.concat(data);
      var meta = data.meta;
      var spinner = new Spinner('Loading data...');
      spinner.start();
      async.whilst(
        function () {return github.hasNextPage(meta.link)},
        function (done) {
          spinner.message('Loading data from GitHub... ' + count++ + ' pages of issue events downloaded');
          github.getNextPage(meta.link, function (err, data2) {
            that.issueEvents = that.issueEvents.concat(data);
            meta = data2.meta;
            done();
          })
        }, function (err) {
          if (err) {
            throw new Error('Problem getting events from repo', err);
          }
          spinner.stop();
          callback();
        });

      }
  });
};



module.exports = IssueScore;