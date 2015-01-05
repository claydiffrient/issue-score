

// var Format = require('../utils/format');
// var axios = require('axios');
var _ = require('lodash');
// var parse = require('parse-link-header');
var GitHubAPI = require('github');
var config = require('config');
var async = require('async');
var Table = require('cli-table');

var issueScore = function (repository) {

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

  // Create a msg object to send
  initialMsg = {
    user: repoUser,
    repo: repoName,
    per_page: 100
  };

  var count = 0;
  github.events.getFromRepoIssues(initialMsg, function (err, data) {
    console.log(count++);
    if (err) {
      throw new Error('Problem getting events from repo', err);
    } else {
      issueEvents = issueEvents.concat(data);
      var meta = data.meta;
      async.whilst(
        function () {return github.hasNextPage(meta.link)},
        function (callback) {
          console.log(count++);
          github.getNextPage(meta.link, function (err, data2) {
            issueEvents = issueEvents.concat(data);
            meta = data2.meta;
            callback();
          })
        }, function (err) {
          if (err) {
            throw new Error('Problem getting events from repo', err);
          }
          calculate()
        });

      }
  });

  var calculate = function () {
    // The uniq seemed necessary because it seemed like the numbers
    // where way too high during testing.
    // TODO: Figure out why :)
    issueEvents = _.uniq(issueEvents);
    var issuesByActor = _.groupBy(issueEvents, function (issueEvent) {
      return issueEvent.actor.login;
    });
    var eventTypeByActor = {};
    var eventTypes = [];
    _.forIn(issuesByActor, function (value, key) {
      eventTypeByActor[key] = _.countBy(value, function (event) {
        eventTypes.push(event.event);
        return event.event;
      });
    });
    // Get a unique listing of events
    eventTypes = _.uniq(eventTypes);
    // console.log(eventTypeByActor);

    var eventHeadings = eventTypes.slice();
    eventHeadings.unshift('');

    var table = new Table({
        head: eventHeadings
    });

    _.forIn(eventTypeByActor, function (value, key) {
      tableRow = {};
      var numbersOnly = [];
      eventTypes.forEach(function (type) {
         numbersOnly.push(value[type] || 0);
      });
      tableRow[key] = numbersOnly;
      table.push(tableRow)
    });


    console.log(table.toString());

  }


};

// issueScore('claydiffrient/classroom-questions');
issueScore('instructure/canvas-lms');

module.exports = issueScore;