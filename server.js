var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var promise =  require('bluebird');
var mysql = require('promise-mysql');

require('date-format-lite');

var port = 1337;
var app = express();

app.use(express.static(path.join(__dirname,"public")));
app.use(bodyParser.urlencoded({extended:true}));

app.listen(port, function(){
    console.log("server is running on port "+port);
})

var db = mysql.createPool({
     host:'localhost',
     user:'root',
     password:'',
     database:'gantt'
});

app.get('/data',function(request, response){
    Promise.all([
        db.query("select * from gantt_tasks"),
        db.query("select * from gantt_links")
    ]).then(function(results){
        var tasks = results[0];
        var links = results[1];

        for(var i=0; i<tasks.length; i++){
            tasks[i].start_date = tasks[i].start_date.format('YYYY MM DD hh:mm:ss');
            tasks[i].open = true;
        }

        response.send({
            data: tasks,
            collections:{links: links}
        });
    }).catch(function(error){
        sendResponse(response, "error", null, error);
    });

});