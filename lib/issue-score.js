var _ = require('lodash');
var GitHubAPI = require('github');
var config = require('config');
var async = require('async');
var Table = require('cli-table');
var Spinner = require('clui').Spinner;

function IssueScore(repository) {
  'use strict';

  var repoRegex = /\S+\/\S+/;

  if (!repository) {
    throw new Error('Invalid repository, should be "user/repo"');
  }

  if (!repoRegex.test(repository)) {
    throw new Error('Invalid repository, should be "user/repo"');
  }

  var splitRepo = repository.split('/');
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

}

IssueScore.prototype.authenticate = function () {
  if (config.has('GitHub.username') && config.has('GitHub.password')) {
    this.github.authenticate({
      type: 'basic',
      username: config.get('GitHub.username'),
      password: config.get('GitHub.password')
    });
  }
};

IssueScore.prototype.fetch = function(callback) {
  'use strict';
  // Call authenticate to authenticate with GitHub if
  // details were provided.
  this.authenticate();
  var that = this;
  var initialMsg = {
    user: that.repository.user,
    repo: that.repository.repo,
    per_page: 100
  };

  var count = 0;
  that.github.events.getFromRepoIssues(initialMsg, function (err, data) {
    if (err) {
      callback(new Error('Problem getting events from repo', err));
    } else {
      that.issueEvents = that.issueEvents.concat(data);
      var meta = data.meta;
      var spinner = new Spinner('Loading data...');
      spinner.start();
      async.whilst(
        function () {return that.github.hasNextPage(meta.link);},
        function (done) {
          spinner.message('Loading data from GitHub... ' + count++ +
                          ' pages of issue events downloaded');
          that.github.getNextPage(meta.link, function (err, data2) {
            that.issueEvents = that.issueEvents.concat(data2);
            meta = data2.meta;
            done(err);
          });
        }, function (err) {
          console.log(err);
          if (err) {
            return callback(new Error('Problem getting events from repo', err));
          }
          spinner.stop();
          callback();
        });

      }
  });
};

/**
 * Creates a table with the given headings then returns it.
 * @param  {Array} headings
 * @return {Table}
 */
var generateTable = function (headings) {
  'use strict';
  return new Table({
      head: headings
  });
};

/**
 * Contains a score mapping for event types returns the score for the given
 * type.
 */
var addToScore = function (type) {
  'use strict';
  switch (type) {
    case 'closed':
    case 'merged':
      return 100;
    case 'reopened':
      return -100;
    case 'subscribed':
      return 10;
    case 'referenced':
      return 25;
    case 'assigned':
    case 'labeled':
    case 'milestoned':
      return 5;
    case 'unassigned':
    case 'unlabeled':
    case 'demilestoned':
      return -5;
    case 'renamed':
    case 'locked':
    case 'mentioned':
      return 1;
    default:
      return 0;
  }
};

IssueScore.prototype.calculate = function () {
  'use strict';
  // The uniq seemed necessary because it seemed like the numbers
  // where way too high during testing.
  // TODO: Figure out why :)
  var issueEvents = _.uniq(this.issueEvents);
  var issuesByActor = _.groupBy(issueEvents, function (issueEvent) {
    if ((issueEvent.actor) && (issueEvent.actor.login)) {
      return issueEvent.actor.login;
    } else {
      return null;
    }

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
    var tableRow = {};
    var numbersOnly = [];
    var score = 0;
    eventTypes.forEach(function (type) {
      var amount = value[type] || 0;
      numbersOnly.push(amount);
      score += addToScore(type) * amount;
    });
    numbersOnly.unshift(score);
    tableRow[key] = numbersOnly;
    table.push(tableRow);
  });

  table.sort(this.sortFunc);

  return table;
};

IssueScore.prototype.sortFunc = function (a, b) {
  'use strict';
  var aa = a[Object.keys(a)[0]][0];
  var bb = b[Object.keys(b)[0]][0];
  return bb - aa;
};






module.exports = IssueScore;