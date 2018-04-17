(function () {
  "use strict";

  const app = {
    socket: io(),
    tableItems: document.querySelectorAll("td"),
    init() {
      sockets.capture();

      document.querySelectorAll("header a").forEach((el) => {
        el.addEventListener("click", () => {
          game.player = el.innerHTML;
          game.turn = true;
        });
      });

      this.tableItems.forEach((el, index) => {
        el.addEventListener("click", () => {
          game.move(index)
        });
      });
    }
  }

  const game = {
    score: new Array(9),
    player: null,
    turn: true,
    move(index) {
      if (this.turn) {
        game.score[index] = this.player;
        this.setColor();
        sockets.send()
        this.turn = !this.turn;
        this.checkWin();
      }
    },
    checkWin() {
      // if((game.score[0] === this.player && game.score[1] === this.player && game.score[2] === this.player) || (game.score[3] === this.player && game.score[4] === this.player && game.score[5] === this.player) || (game.score[6] === this.player && game.score[7] === this.player && game.score[8] === this.player) || (game.score[0] === this.player && game.score[3] === this.player && game.score[6] === this.player) || (game.score[1] === this.player && game.score[4] === this.player && game.score[7] === this.player) || (game.score[2] === this.player && game.score[5] === this.player && game.score[8] === this.player) || (game.score[0] === this.player && game.score[4] === this.player && game.score[8] === this.player) || (game.score[2] === this.player && game.score[4] === this.player && game.score[6] === this.player)){
      //   return true;
      if((game.score[0] === this.player && game.score[1] === this.player && game.score[2] === this.player) || (game.score[3] === this.player && game.score[4] === this.player && game.score[5] === this.player) || (game.score[6] === this.player && game.score[7] === this.player && game.score[8] === this.player) || (game.score[0] === this.player && game.score[4] === this.player && game.score[8] === this.player) || (game.score[2] === this.player && game.score[4] === this.player && game.score[6] === this.player)) {
        alert("WHPOOOOPPP")
      } else {
        return false;
      }
    },
    setColor() {
      this.score.forEach((el, index) => {
        app.tableItems[index].style.background = el;
      });
    }
  };

  const sockets = {
    send(e) {
      app.socket.emit('set', {
        score: game.score
      });
    },
    capture() {
      app.socket.on('set', function(score){
        game.score = score.score;
        game.setColor()
        game.turn = true;
      });
    }
  };

  app.init()
})();
