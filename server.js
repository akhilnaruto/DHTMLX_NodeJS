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

// add a new task
app.post("/data/task", function (req, res) { 
    var task = getTask(req.body);  
   
    db.query("INSERT INTO gantt_tasks(text, start_date, duration, progress, parent)"
      + " VALUES (?,?,?,?,?)", 
      [task.text, task.start_date, task.duration, task.progress, task.parent])
    .then (function (result) {
      sendResponse(res, "inserted", result.insertId);
    })
    .catch(function(error) {
      sendResponse(res, "error", null, error); 
    });
  });
   
  // update a task
  app.put("/data/task/:id", function (req, res) {
    var sid = req.params.id,
      task = getTask(req.body);
   
    db.query("UPDATE gantt_tasks SET text = ?, start_date = ?, "
      + "duration = ?, progress = ?, parent = ? WHERE id = ?",
      [task.text, task.start_date, task.duration, task.progress, task.parent, sid])
    .then (function(result) {
      sendResponse(res, "updated");
    })
    .catch(function(error) {
      sendResponse(res, "error", null, error); 
    });
  });
   
  // delete a task
  app.delete("/data/task/:id", function (req, res) {
    var sid = req.params.id;
    db.query("DELETE FROM gantt_tasks WHERE id = ?", [sid])
    .then (function (result) {
      sendResponse(res, "deleted");
    })
    .catch(function(error) {
      sendResponse(res, "error", null, error); 
    });
  });
   
  // add a link
  app.post("/data/link", function (req, res) {
    var link = getLink(req.body);
   
    db.query("INSERT INTO gantt_links(source, target, type) VALUES (?,?,?)", 
      [link.source, link.target, link.type])
    .then (function (result) {
      sendResponse(res, "inserted", result.insertId);
    })
    .catch(function(error) {
      sendResponse(res, "error", null, error); 
    });
  });
   
  // update a link
  app.put("/data/link/:id", function (req, res) {
    var sid = req.params.id,
      link = getLink(req.body);
   
    db.query("UPDATE gantt_links SET source = ?, target = ?, type = ? WHERE id = ?", 
      [link.source, link.target, link.type, sid])
    .then (function (result) {
      sendResponse(res, "updated");
    })
    .catch(function(error) {
      sendResponse(res, "error", null, error); 
    });
  });
   
  // delete a link
  app.delete("/data/link/:id", function (req, res) {
    var sid = req.params.id;
    db.query("DELETE FROM gantt_links WHERE id = ?", 
      [sid])
    .then (function (result) {
      sendResponse(res, "deleted");
    })
    .catch(function(error) {
        sendResponse(res, "error", null, error); 
    });
  });
   
   
  function getTask(data) {
    return {
      text: data.text,
      start_date: data.start_date.date("YYYY-MM-DD"),
      duration: data.duration,
      progress: data.progress || 0,
      parent: data.parent
    };
  }
   
  function getLink(data) {
    return {
      source: data.source,
      target: data.target,
      type: data.type
    };
  }
   
  function sendResponse(res, action, tid, error) {
   
    if (action == "error")
      console.log(error);
   
    var result = {
      action: action
    };
    if (tid !== undefined && tid !== null)
      result.tid = tid;
   
    res.send(result);
  }
  