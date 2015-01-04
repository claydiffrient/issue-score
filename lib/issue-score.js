

var Format = require('../utils/format');
var axios = require('axios');
var _ = require('lodash');
var parse = require('parse-link-header');
var GitHubAPI = require('github');

var issueScore = function (repository, authDetails) {

  var issueEvents = [];

  if (!repository) {
    throw new Error('You must specify a repository like this: user/repo');
  }
  try {
    var splitRepo = repository.split('/');
    var repoUser = splitRepo[0];
    var repoName = splitRepo[1];
  }
  catch (e) {
    throw new Error('You must specify a repository like this: user/repo');
  }


  var github = new GitHubAPI({
    version: '3.0.0',
    protocol: 'https',
    timeout: 5000,
    headers: {
      'User-Agent': (function () {
        if (authDetails) { return 'Link Score - ' + authDetails.username }
        else { return 'Link Score'}
      })()
    }
  });

  if (authDetails) {
    github.authenticate({
      type: 'basic',
      username: authDetails.username,
      password: authDetails.password
    });
  }

  // Create a msg object to send
  initialMsg = {
    user: repoUser,
    repo: repoName,
    per_page: 100
  };

  github.events.getFromRepoIssues(initialMsg, function (err, data) {
    if (err) {
      throw new Error('Problem getting events from repo', err);
    } else {
      issueEvents = issueEvents.concat(data);
      while (github.hasNextPage(data)) {
        github.getNextPage(data, function (err, data2) {
          data = data2;
          issueEvents = issueEvents.concat(data);
        });
      }
      console.log(issueEvents);



    }
  });


};

// issueScore('claydiffrient/classroom-questions');
issueScore('instructure/canvas-lms', {username:'claydiffrient', password: 'NOTMYPASSWORD'})

module.exports = issueScore;