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
        sendResponse(response, error, null, error);
    });

});

// add new task
app.post('/data/task', function(req,res){
    var task = getTask(req.body); 
    db.query("Insert into gantt_tasks(text, start_date, duration, progress, percent values (?, ?, ?, ?, ?)"
          [task.text, task.start_date, task.duration, task.progress, task.percent]
        ).then(function(result){
            sendResponse(res, "inserted", result.insertId);
        }).catch(function(error){
            sendResponse(res, error, null, error);
          });  
})

//update task
app.put("data/task/:id",function(req, res){
    var sid = req.params.id;
    task = getTask(req.body);

    db.query("update gantt_tasks SET text = ?, start_date = ?, duration = ?, progress = ?, parent = ? where id = ?",
      [task.text. task.start_date, task.duration, task.progress, task.parent, sid]
    ).then(function(result){
       
    }).catch(function(error){
        sendResponse(res, error, null, error)
    });

});

function getTask(data){
    return{
        text: data.text,
        start_date: data.start_date.date("YYYY-MM-DD"),
        duration: data.duration,
        progress: data.progress || 0,
        parent: data.parent
    }
};

function sendResponse(response, action, tid, error){
    if(action == "error"){
        console.log("error");
    }
    var result = {
        action: action
    }
    if(tid !== undefined && tid !== null){
        result.tid = tid;
    }
    response.send(result);
}
