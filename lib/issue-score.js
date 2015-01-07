var _ = require('lodash');
var GitHubAPI = require('github');
var config = require('config');
var async = require('async');
var Table = require('cli-table');
var Spinner = require('clui').Spinner;

var issueScore = function (repository) {

  var issueEvents = [];

  if (!repository) {
    throw new Error('You must specify a repository like this: user/repo');
  }

  var splitRepo = repository.split('/');
  var repoUser = splitRepo[0];
  var repoName = splitRepo[1];

  if (!repoUser || !repoName) {
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
    if (err) {
      throw new Error('Problem getting events from repo', err);
    } else {
      issueEvents = issueEvents.concat(data);
      var meta = data.meta;
      var spinner = new Spinner('Loading data...');
      spinner.start();
      async.whilst(
        function () {return github.hasNextPage(meta.link)},
        function (callback) {
          spinner.message('Loading data from GitHub... ' + count++ + ' pages of issue events downloaded');
          github.getNextPage(meta.link, function (err, data2) {
            issueEvents = issueEvents.concat(data);
            meta = data2.meta;
            callback();
          })
        }, function (err) {
          if (err) {
            throw new Error('Problem getting events from repo', err);
          }
          spinner.stop();
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
    eventHeadings.unshift('Issue Score');
    eventHeadings.unshift('');


    var table = new Table({
        head: eventHeadings
    });

    _.forIn(eventTypeByActor, function (value, key) {
      tableRow = {};
      var numbersOnly = [];
      var score = 0;
      eventTypes.forEach(function (type) {
        var amount = value[type] || 0;
        numbersOnly.push(amount);
        score += addToScore(type) * amount;
      });
      numbersOnly.unshift(score);
      tableRow[key] = numbersOnly;
      table.push(tableRow)
    });

    table.sort(function (a, b) {
      var a = a[Object.keys(a)[0]][0];
      var b = b[Object.keys(b)[0]][0];
      return b - a;
    })

    console.log(table.toString());

  };

  /**
   * Contains a score mapping for event types returns the score for the given
   * type.
   */
  var addToScore = function (type) {
    switch (type) {
      case 'closed':
      case 'merged':
        return 100;
        break;
      case 'reopened':
        return -100;
        break;
      case 'subscribed':
        return 10;
        break;
      case 'referenced':
        return 25;
        break;
      case 'assigned':
      case 'labeled':
      case 'milestoned':
        return 5;
        break;
      case 'unassigned':
      case 'unlabeled':
      case 'demilestoned':
        return -5;
        break;
      case 'renamed':
      case 'locked':
      case 'mentioned':
        return 1;
        break;
      default:
        return 0;
    }
  }


};

module.exports = issueScore;