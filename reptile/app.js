var url = require('url');
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');
var Promise = require('promise');


var app = express();
var baseUrl = 'http://www.qiubai.com/';
var count;

function fullUrl(baseUrl, page)
{
  var path = 'index-'+ page + '.html';
  return url.resolve(baseUrl, path);
}

function fetchData(page, hres, allTopics)
{
  allTopics = allTopics || [];
  page = page || 1;
  
  var url = fullUrl(baseUrl, page);
  console.log(url);
  superagent.get(url)
      .end(function(err, res)
      {
          if(err)
          {
              return console.log(err);
          }

          var $ = cheerio.load(res.text);

          count = count || countPage($);

          var topics = getTopics($);
          allTopics = allTopics.concat(topics);  

          if( page < count )
          {
            fetchData(++page, hres, allTopics);
          }else{
             console.log(allTopics.length);
             hres.send({count: allTopics.length, topics: allTopics}); 
          }
      });
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
  var url = fullUrl(baseUrl, page);
  
  return new Promise(function (resolve, reject) {

     superagent.get(url)
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


app.get('/', function(req, res) {
  var ip = req.ip;
  var allTopics = [];
  var page = 1;
  
  console.log('来自' + ip + '的请求');

  countPage(page).then(function(result){
    console.log(result);
  }, function(err){
    console.log(err);
  });

  // fetchData(page, res, allTopics);
});


app.listen(3000, function(req, res)
{
 console.log('listen on 3000 port.');
});




