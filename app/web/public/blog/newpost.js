// newpost.js
// Source: https://raw.githubusercontent.com/conoro/conoro.github.io/master/_harp/js/newpost.js
// Create all the metadata for a new Harp blogpost
// node newpost.js
// Uses and updates the _data.json file in your _harp directory
// It prompts you for the post-title, post-description and URL of an image that will appear when syndicated to Facebook

// Copyright (C) 2014 Conor O'Neill
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var slug = require('slug');
var fs = require('fs');
var file = './_data.json';
var config;
var harpConfig = require('../harp.json');

fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  config = JSON.parse(data);

  var readline = require('readline');
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Title: ", function(title) {
    rl.question("Description: ", function(description) {
      rl.question("Facebook Thumbnail Image URL: ", function(fbImage) {
        rl.question("Tags: ", function(tags){
            var author = harpConfig.globals.author;
            var ptype = "post";
            var status = "publish";

            // slug module doesn't replace periods which causes Harp to choke when serving up static file
            var slugTitle = slug(title).toLowerCase().split('.').join("");
            var publishDate = (new Date).getTime();

            var maxProp = "ID";
            var maxVal = 0;

            for (post in config) {
                var value = parseInt(config[post][maxProp], 10);
                if (value > maxVal) {
                    maxVal = value;
                }
            }

            var id = maxVal + 1;

            var newPost = {"ID": id, "author": author, "date": publishDate, "ptype": ptype, "description": description, "slug": slugTitle, "status": status, "title": title, "FBImage": fbImage, "tags": tags.split(',')};

            config[slugTitle] = newPost;

            fs.writeFile(file, JSON.stringify(config, null,  2), function(err) {
              if(err) {
                console.log(err);
              } else {
              fs.writeFile("./"+slugTitle+".md", description, function(err) {
                if(err) {
                  console.log(err);
                } else {
                  console.log("The new post was created as ../"+slugTitle+".md");
                }
              }); 
              console.log("_data.json was updated");
              }
            }); 
            rl.close();
        });
      });     
    });
  });
});