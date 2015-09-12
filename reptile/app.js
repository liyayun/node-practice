var url = require('url');
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');
var Promise = require('promise');


var app = express();
var baseUrl = 'http://www.qiubai.com/';
var count;

function fullUrls(pages)
{

  var urls = [];
  for (var i = 1; i <= pages; i++) {
    var path = 'index-'+ i + '.html';
    var pageUrl = url.resolve(baseUrl, path);
    urls.push(pageUrl);       
  };

  return urls;
}



function getTopics($){
  var topics = [];
  $('.content-block .block').each(function(index, element){
    var topic = {};
    var $element = $(element);

    var authorEle = $element.find('.author');
    var title = authorEle.children().eq(0).children().eq(0).text();
    topic.title = title;

    var contentEle = $element.find('.content');
    var content = contentEle.children('p').eq(0).text();
    topic.content = content;

    var hasThumb = contentEle.next().hasClass('thumb');
    if(hasThumb)
    {
      var image = contentEle.next().find('a').eq(0).attr('href');
      topic.image = image;
    }

    topics.push(topic);
  });
  return topics;
}



function countPage(page){
  
  return new Promise(function (resolve, reject) {
   superagent.get(baseUrl)
   .end(function(err, res){
    if(err)
    {
      reject(err);
    }

    var $ = cheerio.load(res.text);

    var pbEle = $('.pagebar').eq(0);
    var aEles = pbEle.find('a');
    var lastAE = aEles.eq(aEles.length - 1);
    var count = lastAE.attr('href').split('-')[1].split('.')[0];

    resolve(count);
  });
 });
}


function fetchData(url, callback)
{
  superagent.get(url)
  .end(function(err, res)
  {
    if(err)
    {
      return console.log(err);
    }

    console.log('正在获取',url, '页面的数据...');
    var $ = cheerio.load(res.text);
    count = count || countPage($);

    var topics = getTopics($);  
    callback(null, topics);  
 });
}




app.get('/', function(req, res) {
  var ip = req.ip;
  var page = 1;
  console.log('来自' + ip + '的请求');

  countPage(page).then(function(result){
    var urls = fullUrls(result); 
    // console.log(urls);

    // var urls = ['http://www.qiubai.com/index-1.html', 'http://www.qiubai.com/index-2.html','http://www.qiubai.com/index-3.html'];
    async.mapLimit(urls, 20, function (url, callback) {
      fetchData(url, callback);
    }, function (err, data) {
      console.log('final');
      res.send(data);
    });

  }, function(err){
    console.log(err);
  });

});


app.listen(3000, function(req, res)
{
 console.log('listen on 3000 port.');
});




