var url = require('url');
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');

var app = express();
var cnodeUrl = 'https://cnodejs.org/';

app.get('/', function (req, res, next) {
  // 用 superagent 去抓取 https://cnodejs.org/ 的内容
  superagent.get(cnodeUrl)
    .end(function (err, sres) {
      // 常规的错误处理
      if (err) {
        return console.log(err);
      }
      // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
      // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
      // 剩下就都是 jquery 的内容了
      var $ = cheerio.load(sres.text);
      var topicUrls = [];
      $('#topic_list .topic_title').each(function (idx, element) {
        var $element = $(element);
        var href = url.resolve(cnodeUrl, $element.attr('href'));
        topicUrls.push(href);
      });

      var ep = new eventproxy();
      ep.after('fetchedDataSuccess', topicUrls.length, function (topics) {
        topics = topics.map(function (topicPair) {
          var topicUrl = topicPair[0];
          var topicHtml = topicPair[1];
          var $ = cheerio.load(topicHtml);
            return ({
              title: $('.topic_full_title').text().trim(),
              href: topicUrl,
              comment1: $('.reply_content').eq(0).text().trim()
            });
          });
        console.log('data:');
        console.log(topics);
        res.send(topics);
      });

      topicUrls.forEach(function(topicUrl){
        superagent.get(topicUrl)
        .end(function(err,  res){
            console.log('fetch ' + topicUrl + ' successful');
            ep.emit('fetchedDataSuccess', [topicUrl, res.text]);
        });
      });

    });
});

app.listen(3000, function(req, res){
	console.log('listen on 3000 port.');
});

