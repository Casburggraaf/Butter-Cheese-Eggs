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
  res.render('index.ejs');
}

const game = {
  score: new Array(9).fill(null),
  player: "Green",
  checkEnding() {
    console.log(this.score);
    if((this.score[0] === "Green" && this.score[1] === "Green" && this.score[2] === "Green") || (this.score[3] === "Green" && this.score[4] === "Green" && this.score[5] === "Green") || (this.score[6] === "Green" && this.score[7] === "Green" && this.score[8] === "Green") || (this.score[0] === "Green" && this.score[4] === "Green" && this.score[8] === "Green") || (this.score[2] === "Green" && this.score[4] === "Green" && this.score[6] === "Green")) {
      gameMechanics.winner = "Green";
      console.log("Winner green");
      return true;
    } else if((this.score[0] === "Yellow" && this.score[1] === "Yellow" && this.score[2] === "Yellow") || (this.score[3] === "Yellow" && this.score[4] === "Yellow" && this.score[5] === "Yellow") || (this.score[6] === "Yellow" && this.score[7] === "Yellow" && this.score[8] === "Yellow") || (this.score[0] === "Yellow" && this.score[4] === "Yellow" && this.score[8] === "Yellow") || (this.score[2] === "Yellow" && this.score[4] === "Yellow" && this.score[6] === "Yellow")) {
      gameMechanics.winner = "Yellow";
      console.log("Winner Yellow");
      return true;
    } else if (gameMechanics.move === 11) {
      gameMechanics.winner = "Grey";
      console.log("Winner None");
      return true;
    } else {
      return false;
    }
  }
};

const gameMechanics = {
  status: "intro",
  gameId: Math.floor(Math.random() * 9000) + 1000,
  sets: [],
  move: 1,
  intro: true,
  introTime: 60,
  setTime: 2000,
  winner: null,
  init() {
    if(this.status === "intro"){
      sockets.init();
      let coutndown = setInterval(() => {
        this.introTime--;
        console.log(this.introTime);
        if(this.introTime <= 0){
          if(players.length >= 2) {
            this.intro = false;
            this.introTime = 60;
            this.status = "gameSetup";
            clearInterval(coutndown);
            this.init();

          } else {
            this.introTime = 60;
            console.log(this);
            sockets.emitIntro();
          }
        }
      },1000);
    } else if (this.status === "gameSetup") {
      console.log(this.status);
      players = utils.suffle(players);
      twitter.tweetTeamInit();
      sockets.emitIntro();
      sockets.emitGame();
      this.status = "game";
      this.init();
    } else if (this.status === "game") {
      twitter.tweetTeam();
      setTimeout(() => {
        if (this.sets.length === 0) {
          let avilibleChoses = [];
          for (let i = 0; i < game.score.length; i++) {
            if (game.score[i] === null) {
              avilibleChoses.push(i);
            };
          }

          let randomChose = avilibleChoses[Math.floor(Math.random() * avilibleChoses.length)];
          game.score[randomChose] = game.player;
        } else {
          let moves = [];
          for (let i = 0; i < this.sets.length; i++) {
            moves.push(this.sets[i].set);
          };
          console.log(moves);
          let move = utils.getMostVotes(moves);
          console.log(move);
          console.log(typeof move);
          game.score[move -1] = game.player;
          console.log(game.score);
        }

        if (game.player === "Green") {
          game.player = "Yellow";
        } else {
          game.player = "Green";
        }

        this.sets = []
        this.move = this.move + 1;
        console.log(game.checkEnding())
        if(game.checkEnding()){
          this.status = "finish";
          this.init();
        } else {
          sockets.emitResetPoll();
          sockets.emitGame();
          this.init();
        }

      }, this.setTime);
    } else if (this.status === "finish") {
      game.score = new Array(9).fill(gameMechanics.winner)
      game.player = gameMechanics.winner;
      sockets.emitResetPoll();
      sockets.emitGame();
      twitter.tweetWinner();

      setTimeout(() => {
        this.status = "intro";
        this.gameId = Math.floor(Math.random() * 9000) + 1000;
        this.move = 1;
        game.score = new Array(9).fill(null);
        this.intro = true;
        players = [];
        this.init();
      }, 10000);

    }
  }
};

let players = [
//   {
//   id: 988760577932750800,
//   handler: `@ButterCheeseEgg`,
//   color: null,
//   sets: new Array(9).fill(null)
// }
];

const twitter = {
  tweetTeamInitCountI: 0,
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
  tweetTeamInit() {
    if(this.tweetTeamInitCountI < players.length){
      if (this.tweetTeamInitCountI % 2 == 0) {
        players[this.tweetTeamInitCountI].color = "Green";
      } else {
        players[this.tweetTeamInitCountI].color = "Yellow";
      }
      twitter.post(`${players[this.tweetTeamInitCountI].handler} Your team is ${players[this.tweetTeamInitCountI].color} #Game${gameMechanics.gameId}`).then(() => {
        this.tweetTeamInitCountI ++;
        this.tweetTeamInit();
      }).catch((error) => {
        console.log(error);
        this.tweetTeamInitCountI ++;
        this.tweetTeamInit();
      });
    } else {
      this.tweetTeamCountI = 0;
    }
  },
  tweetTeam() {
    let currentTeam = players.filter((el) => {
      return el.color === game.player;
    });

    if (this.tweetTeamCountI < currentTeam.length) {
      twitter.post(`${currentTeam[this.tweetTeamCountI].handler} It's your teams turn, replay your move to this message #Game${gameMechanics.gameId} #move${gameMechanics.move}`).then(() => {
        this.tweetTeamCountI ++;
        this.tweetTeam();
      }).catch((error) => {
        console.log(error);
        this.tweetTeamCountI ++;
        this.tweetTeam();
      });
    } else {
      this.tweetTeamCountI = 0;
    }
  },
  tweetWinner() {
    if(this.tweetTeamInitCountI < players.length){
      twitter.post(`${players[this.tweetTeamInitCountI].handler} There is a winner! Team ${gameMechanics.winner} won! #Game${gameMechanics.gameId}`).then(() => {
        this.tweetTeamInitCountI ++;
        this.tweetTeamInit();
      }).catch((error) => {
        console.log(error);
        this.tweetTeamInitCountI ++;
        this.tweetTeamInit();
      });
    } else {
      this.tweetTeamCountI = 0;
    }
  }
};


const sockets = {
  init() {
    io.on('connection', (socket) => {
      this.emitGame();
      this.emitIntro();
      this.disconnect(socket);
    });
  },
  emitGame() {
    io.emit('game', {
      score: game.score,
      player: game.player,
      timer: gameMechanics.setTime
    });
  },
  emitIntro() {
    io.emit("intro", {
      status: gameMechanics.intro,
      countdown: gameMechanics.introTime,
      gameId: gameMechanics.gameId,
      amountPlayers: players.length
    });
  },
  emitPoll(number) {
    io.emit("poll", {
      number: number,
      player: game.player
    });
  },
  emitResetPoll() {
    io.emit("resetPoll", {

    });
  },
  disconnect(socket) {
    socket.on('disconnect', () => {
      console.log('user disconnected');
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
  },
  getMostVotes(store){
    let frequency = {};
    let max = 0;
    let result;
    let multiple = false;
    let multipleStorage = [];

    for(let v in store) {
      frequency[store[v]]=(frequency[store[v]] || 0)+1;
      if(frequency[store[v]] > max) {
				multipleStorage = [];
				multiple = false;
        max = frequency[store[v]];
        result = store[v];
      } else if(frequency[store[v]] === max) {
				multiple = true;
				multipleStorage.push(store[v]);
			}
    }

    if(multiple) {
    	multipleStorage.push(result);
    	result = multipleStorage[Math.floor(Math.random() * multipleStorage.length)];
    	console.log("Random choose = " + result);
    	return result
    } else {
    	console.log("One item = " + result)
    	return result
    }
  }
};

// You can also get the stream in a callback if you prefer.
client.stream('statuses/filter', {track: '@ButterCheeseEgg'}, function(stream) {
  stream.on('data', function(event) {
    console.log(event && event.text);
    console.log(event.user);
    let text = event.text.toLowerCase();

    switch(gameMechanics.status){
      case "intro":
        if (text.includes("join") && event.user.screen_name !== "ButterCheeseEgg") {
          let number = event.text.match(/\d/g);
          number = number.join("");
          // number = number.substring(0,1)
          console.log(number);
          console.log(gameMechanics.gameId);
          if (number == gameMechanics.gameId) {
            players.push({
              id: event.user.id,
              handler: `@${event.user.screen_name}`,
              color: null,
              sets: new Array(9).fill(null)
            });
            console.log(players);
            twitter.post(`${players[players.length -1].handler} Welcome to buttercheeseeggs, Game starts in ${gameMechanics.introTime} Seconds`);
            sockets.emitIntro();
          }
        }
        break;
      case "game":
        if (event.user.screen_name !== "ButterCheeseEgg") {
          let number = event.text.match(/\d/g);
          number = number.join("");
          number = number.substring(0, 1);

          let user = players.find((players)=> {
            return players.id === event.user.id
          });

          if(user.color === game.player) {
            if (number >= 1 && number <= 9) {
              gameMechanics.sets.push({
                id: user.id,
                set: number
              })
              game.score[number - 1] = user.color;
              game.player = user.color;
              sockets.emitPoll(number -1)
              //sockets.emitGame();
            }
          } else {
            twitter.post(`${user.handler} It's not your turn, your team is ${user.color}`);
          }
        }
        break;
    }
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});

gameMechanics.init();
http.listen(3008, function() {
})



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
