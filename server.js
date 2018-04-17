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

const game = {
  score: new Array(9).fill(null),
  player: null,
  checkEnding() {
    for(let i = 0; i < this.score.length; i++){
      console.log(this.score[i]);
      if (this.score[i] === false) {
        return false;
      }
    }
  }
}

game.checkEnding();

io.on('connection', function(socket){
  console.log('a user connected');

  io.emit('set', {
    score: game.score,
    player: game.player
  });


  socket.on('set', function(msg){
    io.emit('set', msg);
    game.score = msg.score;
    game.player = msg.player;

    if (game.checkEnding()) {
      console.log("asjlkdfhklsjdh");
    }
    console.log(msg);

  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(3008, function() {
})
