module.exports = {
    extractTweetInfo: function (tweetJson) {
        var userInfo = tweetJson["user"];
        var tweetText = tweetJson["text"];
        var screenName = userInfo["screen_name"];

        return {
            tweet: tweetText,
            user: screenName
        }
    }
    ,
    containsUrl: function (tweetData) {
        var tweetText = tweetData["text"];
        if (new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?").test(tweetText))
            return true;
        else
            return false;
    },

    extractUrl: function (tweetData) {
        var tweetText = tweetData["entities"]["urls"];
        var matches = tweetText.map(a => a["expanded_url"]);
        return matches;
    },

    extractUser: function (tweetData) {

        return tweetData["user"];
    },
    extractDomain: function url_domain(data) {

        return (new URL(data)).hostname;
    },
    showMax: function (a) {
        b = {};
        max = '', maxi = 0;
        for (let k of a) {
            if (b[k]) b[k]++; else b[k] = 1;
            if (maxi < b[k]) { max = k; maxi = b[k] }
        }
        return max;
    },
    formatTweet: function (tweet) {
        var tweetText = tweet["tweet"];
        var tweetUser = tweet["user"];
        var element = "<br><div style='border:solid 1px black'>" + tweetText + "<div>" + tweetUser + "</div>" + "</div><br>";
        return element;
    },
    dateNDaysAgo: function (days) {

        var date = new Date();
        var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
        return last;
    }
}