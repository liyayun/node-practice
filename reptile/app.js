var url = require('url');
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');
var Promise = require('promise');


var app = express();
var baseUrl = 'http://www.qiubai.com/';

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



function countPage(){
  return new Promise(function (resolve, reject) {
   superagent.get(baseUrl)
   .end(function(err, res){
    if(err)
    {
      reject(err);
      return;
    }

    var $ = cheerio.load(res.text);

    try{
      var pbEle = $('.pagebar').eq(0);
      var aEles = pbEle.find('a');
      var lastAE = aEles.eq(aEles.length - 1);
      var count = lastAE.attr('href').split('-')[1].split('.')[0];
    }catch(exception){
      reject(exception);
      return;
    }

    resolve(count);
    return;
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

    var topics = getTopics($);  
    callback(null, topics);  
 });
}




app.get('/', function(req, res) {
  var ip = req.ip;
  console.log('来自' + ip + '的请求');

  countPage().then(function(result){
    var urls = fullUrls(result); 
    var topics = [];

    async.mapLimit(urls, 10, function (url, callback) {
      fetchData(url, callback);
    }, function (err, data) {
      console.log('final');
      if(err){
         return console.log(err); 
      };

      for (var i = 0; i < data.length; i++) {
        topics = topics.concat(data[i]);
      };
      res.send(topics); 
    });

  }, function(err){
    console.log(err);
  });

});


app.listen(3000, function(req, res)
{
 console.log('listen on 3000 port.');
});




