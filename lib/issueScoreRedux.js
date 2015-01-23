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
    this.github.authenticate({
      type: 'basic',
      username: config.get('GitHub.username'),
      password: config.get('GitHub.password')
    });
  }

};

IssueScore.prototype.fetch = function(callback) {
  var that = this;
  var initialMsg = {
    user: that.repository.user,
    repo: that.repository.repo,
    per_page: 100
  };

  var count = 0;
  that.github.events.getFromRepoIssues(initialMsg, function (err, data) {
    if (err) {
      throw new Error('Problem getting events from repo', err);
    } else {
      that.issueEvents = that.issueEvents.concat(data);
      var meta = data.meta;
      var spinner = new Spinner('Loading data...');
      spinner.start();
      async.whilst(
        function () {return that.github.hasNextPage(meta.link)},
        function (done) {
          spinner.message('Loading data from GitHub... ' + count++ + ' pages of issue events downloaded');
          that.github.getNextPage(meta.link, function (err, data2) {
            that.issueEvents = that.issueEvents.concat(data2);
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

IssueScore.prototype.calculate = function () {
  // The uniq seemed necessary because it seemed like the numbers
  // where way too high during testing.
  // TODO: Figure out why :)
  var issueEvents = _.uniq(this.issueEvents);
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

  var table = generateTable(eventHeadings);


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
  });

  return table;
};

/**
 * Creates a table with the given headings then returns it.
 * @param  {Array} headings
 * @return {Table}
 */
var generateTable = function (headings) {
  return new Table({
      head: headings
  });
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
};



module.exports = IssueScore;