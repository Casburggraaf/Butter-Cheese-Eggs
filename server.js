var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static('static'))
  .set('view engine', 'ejs')
  .set('views', 'view')
  .get('/', index)
  .get('/index.html', index)

function index(req, res) {
  res.render('index.ejs');
}

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('set', function(msg){
    io.emit('set', msg);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(3008, function() {
})
