# ButterCheeseEgg
> A Tic Tac Toe game controlled with twitter, [Live Demo](https://buttercheeseeggs.casburggraaf.com)

[![Build Status](https://travis-ci.org/Casburggraaf/Butter-Cheese-Eggs.svg?branch=master)](https://travis-ci.org/Casburggraaf/Butter-Cheese-Eggs) [![LiveDemo](https://img.shields.io/badge/Live%20Demo-online-brightgreen.svg)](https://buttercheeseeggs.casburggraaf.com) [![HitCount](http://hits.dwyl.io/Casburggraaf/Butter-Cheese-Eggs.svg)](http://hits.dwyl.io/Casburggraaf/Butter-Cheese-Eggs)
 [![license](https://img.shields.io/github/license/nhnent/tui.editor.svg)](https://github.com/nhnent/tui.editor/blob/master/LICENSE)

<p align="center"><a href="https://buttercheeseeggs.casburggraaf.com"><img width="1337" alt="screen shot 2018-05-25 at 13 28 32" src="https://user-images.githubusercontent.com/373753/40542245-ab57f87c-601f-11e8-859b-f8ac29c5d4c4.png">
</a></p>


## 🌏 Browser Support

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Opera |
| --------- | --------- | --------- | --------- | --------- | --------- |
| IE11, Edge| last 2 versions| last 2 versions| last 2 versions| last 2 versions| last 2 versions

### 📙 Overview
ButterCheeseEgg is a tic tac toe game playable with your own twitter account. Moves are made democratic if there is more than 1 player. This game is made for the course "Realtime Web" of the minor Everything Web on the Amsterdam university of applied science.

## 🎨 Features
* A tic tac toe game
* Democratic voting
* A twitter bot who sends your tweet when you need to make a move
* A logic that can shuffle player and assign teams and can make decision when there is no popular vote
* A web application where you can see the game
* WebSockets, [socket.io](https://socket.io) for realtime game info
* Offline detection

## 🚀 Installation
Clone the repository
```shell
$ git clone https://github.com/Casburggraaf/Butter-Cheese-Eggs
```
Install the packages
```shell
$ npm install
```
Make a .env
```shell
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN_KEY=
TWITTER_ACCESS_TOKEN_SECRET=
```
Run the application
```shell
$ npm start
```
Or run the application for development.
```shell
$ npm run dev
```

## 💾 Data

![untitled diagram](https://user-images.githubusercontent.com/373753/40544833-da775274-6029-11e8-931c-6326b8f95e90.png)

[Twitter](https://twitter.com) is used as external api. The data is obtained with the streaming api of twitter. The npm package [twitter](https://www.npmjs.com/package/twitter) is used for handling the streaming api.
This code is used for watching the stream of incomming tweet to the user @ButterCheeseEgg
```JavaScript
client.stream('statuses/filter', {track: '@ButterCheeseEgg'}, function(stream) {
  stream.on('data', function(event) {
    let text = event.text.toLowerCase();

    switch(gameMechanics.status){
      case "intro":
        if (text.includes("join") && event.user.screen_name !== "ButterCheeseEgg") {
          let number = event.text.match(/\d/g);
          number = number.join("");
          if (number == gameMechanics.gameId) {
            players.push({
              id: event.user.id,
              handler: `@${event.user.screen_name}`,
              color: null,
              sets: new Array(9).fill(null)
            });
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
```
If the game is in "intro" mode the application is watching mention to @ButterCheeseEgg with ```@ButterCheeseEgg join (gameId)``` If a player joins he is stored for that game in the object players
```javascript
let players = [
  {
  id: 988760577932750800,
  handler: `@ButterCheeseEgg`,
  color: null,
  sets: new Array(9).fill(null)
}
];
```
In this object is stored:
* Player id which is the same as the twitter id
* The username handler
* The team that the player is in
* and what moves the player have made

There is also a object that stores:
```JavaScript
const gameMechanics = {
  status: "intro",
  gameId: Math.floor(Math.random() * 9000) + 1000,
  sets: [],
  move: 1,
  intro: true,
  introTime: 60,
  setTime: 30000,
  winner: null,
  init() {}
};
```
* Game status. Intro, playing or finished
* GameId, this is needed otherwise there are duplicate tweets and that is not allowed by Twitter
* Sets, the current sets
* Moves, on which move the game is currently
* Winner, if there is a winner it's stored here

### Data manipulation
I also made a "utils" object with to features
* Shuffle the players
* A function that decides with move is democratically chosen

```javascript
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
```

### TODO
These improvement can be done to improve the app even further
* An other way of input. Like telegram or on the web application itself
* Sending the game progress in the tweets
* An AI player so there is no need of 2 players

## 📜 License
This software is licensed under the [MIT](https://github.com/nhnent/tui.editor/blob/master/LICENSE) © [Cas Burggraaf](https://github.com/CasBurggraaf)

[![Build Status](https://travis-ci.org/Casburggraaf/Butter-Cheese-Eggs.svg?branch=master)](https://travis-ci.org/Casburggraaf/Butter-Cheese-Eggs) [![LiveDemo](https://img.shields.io/badge/Live%20Demo-online-brightgreen.svg)](https://buttercheeseeggs.casburggraaf.com) [![HitCount](http://hits.dwyl.io/Casburggraaf/Butter-Cheese-Eggs.svg)](http://hits.dwyl.io/Casburggraaf/Butter-Cheese-Eggs)
 [![license](https://img.shields.io/github/license/nhnent/tui.editor.svg)](https://github.com/nhnent/tui.editor/blob/master/LICENSE)
