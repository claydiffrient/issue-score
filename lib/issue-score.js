

var Format = require('../utils/format');

var issueScore = function (repository) {
  var requestUrl = Format('https://api.github.com/repos/{0}/issues/events?per_page=100', repository);
  return {
    apiUrl: requestUrl
  };
};

module.exports = issueScore;