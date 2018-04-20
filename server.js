var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var Twitter = require('twitter');

app.use(express.static('static'))
  .set('view engine', 'ejs')
  .set('views', 'view')
  .get('/', index)
  .get('/index.html', index)

function index(req, res) {
  res.render('index.ejs', {gameId: game.gameId});
}

const game = {
  score: new Array(9).fill(null),
  player: null,
  gameId: Math.floor(Math.random() * 90000) + 10000,
  checkEnding() {
    if((this.score[0] === "Green" && this.score[1] === "Green" && this.score[2] === "Green") || (this.score[3] === "Green" && this.score[4] === "Green" && this.score[5] === "Green") || (this.score[6] === "Green" && this.score[7] === "Green" && this.score[8] === "Green") || (this.score[0] === "Green" && this.score[4] === "Green" && this.score[8] === "Green") || (this.score[2] === "Green" && this.score[4] === "Green" && this.score[6] === "Green")) {
      this.score = new Array(9).fill(null);
      return true;
    } else if((this.score[0] === "Green" && this.score[1] === "Yellow" && this.score[2] === "Yellow") || (this.score[3] === "Yellow" && this.score[4] === "Yellow" && this.score[5] === "Yellow") || (this.score[6] === "Yellow" && this.score[7] === "Yellow" && this.score[8] === "Yellow") || (this.score[0] === "Yellow" && this.score[4] === "Yellow" && this.score[8] === "Yellow") || (this.score[2] === "Yellow" && this.score[4] === "Yellow" && this.score[6] === "Yellow")) {
      this.score = new Array(9).fill(null);
      return true;
    }
  }
}

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
      io.emit('set', {
        score: game.score,
        player: game.player
      });
    }
    console.log(msg);

  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

require('dotenv').config()

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// You can also get the stream in a callback if you prefer.
client.stream('statuses/filter', {track: '#buttercheeseeggs'}, function(stream) {
  stream.on('data', function(event) {
    console.log(event && event.text);
    console.log(event.user);

    console.log(typeof event.text);
    let gameId = event.text.split("#game").pop();
    console.log("gameid= " + gameId);

    if (gameId == game.gameId) {
      if(event.text.includes("Green")){
        let number = event.text.match(/\d/g);
        number = number.join("");
        number = number.substring(0,1)
        console.log(number, typeof number);
        if (number >= 1 && number <= 9) {
          game.score[number - 1] = "Green";
          game.player = "Green";
          io.emit('set', {
            score: game.score,
            player: game.player
          });

          if (game.checkEnding()) {
            io.emit('set', {
              score: game.score,
              player: game.player
            });
          }
        }
      } else if(event.text.includes("Yellow")){
        let number = event.text.match(/\d/g);
        number = number.join("");
        number = number.substring(0,1)
        console.log(number, typeof number);
        if (number >= 1 && number <= 9) {
          game.score[number - 1] = "Yellow";
          game.player = "Yellow";
          io.emit('set', {
            score: game.score,
            player: game.player
          });

          if (game.checkEnding()) {
            io.emit('set', {
              score: game.score,
              player: game.player
            });
          }
        }
      }
    }
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});


http.listen(3008, function() {
})
