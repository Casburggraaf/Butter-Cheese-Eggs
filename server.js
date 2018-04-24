var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var Twitter = require('twitter');
require('dotenv').config()
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

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
  player: "Green",
  gameId: Math.floor(Math.random() * 9000) + 1000,
  checkEnding() {
    if((this.score[0] === "Green" && this.score[1] === "Green" && this.score[2] === "Green") || (this.score[3] === "Green" && this.score[4] === "Green" && this.score[5] === "Green") || (this.score[6] === "Green" && this.score[7] === "Green" && this.score[8] === "Green") || (this.score[0] === "Green" && this.score[4] === "Green" && this.score[8] === "Green") || (this.score[2] === "Green" && this.score[4] === "Green" && this.score[6] === "Green")) {
      this.score = new Array(9).fill(null);
      return true;
    } else if((this.score[0] === "Yellow" && this.score[1] === "Yellow" && this.score[2] === "Yellow") || (this.score[3] === "Yellow" && this.score[4] === "Yellow" && this.score[5] === "Yellow") || (this.score[6] === "Yellow" && this.score[7] === "Yellow" && this.score[8] === "Yellow") || (this.score[0] === "Yellow" && this.score[4] === "Yellow" && this.score[8] === "Yellow") || (this.score[2] === "Yellow" && this.score[4] === "Yellow" && this.score[6] === "Yellow")) {
      this.score = new Array(9).fill(null);
      return true;
    }
  }
};

const gameMechanics = {
  status: "intro",
  intro: true,
  introTime: 60,
  init() {
    if(this.status === "intro"){

    }
  }
}

let players = [{
  id: 988760577932750800,
  handler: `@ButterCheeseEgg`,
  color: null,
  sets: new Array(9).fill(null)
}];

const twitter = {
  tweetTeamCountI: 0,
  post(text) {
    const promise = new Promise(function (resolve, reject) {
      console.log(text);
      client.post('statuses/update', {status: text})
        .then(function (tweet) {
          console.log(tweet);
          resolve();
        })
        .catch(function (error) {
          console.log(error);
          //throw error;
          resolve();
      });
    });
    return promise;
  },
  tweetTeam() {
    if(this.tweetTeamCountI < players.length){
      if (this.tweetTeamCountI % 2 == 0) {
        players[this.tweetTeamCountI].color = "Green";
      } else {
        players[this.tweetTeamCountI].color = "Yellow";
      }
      twitter.post(`${players[this.tweetTeamCountI].handler} Your team is ${players[this.tweetTeamCountI].color}`).then(() => {
        this.tweetTeamCountI ++;
        this.tweetTeam();
      }).catch((error) => {
        console.log(error);
        this.tweetTeamCountI ++;
        this.tweetTeam();
      });

    }
  }
};


const sockets = {
  init() {
    io.on('connection', (socket) => {
      this.emitGame();
      this.emitIntro();
    });
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  },
  emitGame() {
    io.emit('game', {
      score: game.score,
      player: game.player
    });
  },
  emitIntro() {
    io.emit("intro", {
      status: true,
      countdown: 50,
      gameId: game.gameId,
      amountPlayers: players.length
    });
  }
}

const utils = {
  suffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }
};

// You can also get the stream in a callback if you prefer.
client.stream('statuses/filter', {track: '@ButterCheeseEgg'}, function(stream) {
  stream.on('data', function(event) {
    console.log(event && event.text);
    console.log(event.user);
    let text = event.text.toLowerCase();

    if (text.includes("Join")) {
      let number = event.text.match(/\d/g);
      number = number.join("");
      // number = number.substring(0,1)
      console.log(number);
      console.log(game.gameId);
      if (number == game.gameId) {
        players.push({
          id: event.user.id,
          handler: `@${event.user.screen_name}`,
          color: null,
          sets: new Array(9).fill(null)
        });
        console.log(players);
        twitter.post(`${players[players.length -1].handler} Welcome to buttercheeseeggs, Games starts in 60 Seconds`)
      }

      players = utils.suffle(players);
      twitter.tweetTeam();

    } else if(event.user.screen_name == "ButterCheeseEgg"){
      let number = event.text.match(/\d/g);
      number = number.join("");
      number = number.substring(0, 1);

      let user = players.find((players)=> {
        return players.id === event.user.id
      });

      console.log(number, typeof number);
      if (number >= 1 && number <= 9) {
        game.score[number - 1] = user.color;
        game.player = user.color;

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
    // console.log(typeof event.text);
    // let gameId = event.text.split("#game").pop();
    // console.log("gameid= " + gameId);
    //
    // if (gameId == game.gameId) {
    //   if(event.text.includes("Green")){
    //     let number = event.text.match(/\d/g);
    //     number = number.join("");
    //     number = number.substring(0,1)
    //     console.log(number, typeof number);
    //     if (number >= 1 && number <= 9) {
    //       game.score[number - 1] = "Green";
    //       game.player = "Green";
    //       io.emit('set', {
    //         score: game.score,
    //         player: game.player
    //       });
    //
    //       if (game.checkEnding()) {
    //         io.emit('set', {
    //           score: game.score,
    //           player: game.player
    //         });
    //       }
    //     }
    //   } else if(event.text.includes("Yellow")){
    //     let number = event.text.match(/\d/g);
    //     number = number.join("");
    //     number = number.substring(0,1)
    //     console.log(number, typeof number);
    //     if (number >= 1 && number <= 9) {
    //       game.score[number - 1] = "Yellow";
    //       game.player = "Yellow";
    //       io.emit('set', {
    //         score: game.score,
    //         player: game.player
    //       });
    //
    //       if (game.checkEnding()) {
    //         io.emit('set', {
    //           score: game.score,
    //           player: game.player
    //         });
    //       }
    //     }
    //   }
    // }
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});


http.listen(3008, function() {
})
