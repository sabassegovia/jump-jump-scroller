window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 720;
  let enemies = [];
  let score = 0;
  let gameOver = false;
  const fullscreenbtn = document.getElementById('fullscreenbtn');

  class InputHandler {
    constructor() {
      this.keys = [];
      this.touchY = '';
      this.touchThreshold = 30;
      window.addEventListener('keydown', (e) => {
        if ((e.key === "ArrowDown" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") &&
          this.keys.indexOf(e.key) === -1) {
          this.keys.push(e.key);
        } else if (e.key === "Enter" && gameOver) {
          restartGame()
        }
      });
      window.addEventListener('keyup', e => {
        if (e.key === "ArrowDown" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") {
          this.keys.splice(this.keys.indexOf(e.key), 1);

        }
      });
      window.addEventListener('touchstart', e => {
        console.log('start');
        this.touchY = e.changedTouches[0].pageY;
      });
      window.addEventListener('touchmove', e => {
        const swipeDist = e.changedTouches[0].pageY - this.touchY;
        if (swipeDist < -this.touchThreshold && this.keys.indexOf('swipe up') === -1) {
          this.keys.push('swipe up');
          e.preventDefault();
        }
        else if (swipeDist > this.touchThreshold && this.keys.indexOf('swipe down') === -1) {
          this.keys.push('swipe down');
          e.preventDefault();
          if(gameOver) restartGame()
        }
      });
      window.addEventListener('touchend', e => {
        console.log(this.keys);
        this.keys.splice(this.keys.indexOf('swipe up'), 1);
        this.keys.splice(this.keys.indexOf('swipe down'), 1);
        e.stopPropagation();
      });
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 200;
      this.height = 200;
      this.x = 0;
      this.y = this.gameHeight - this.height;
      this.image = document.getElementById('player');
      this.frameX = 0;
      this.maxFrame = 8;
      this.frameY = 0;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 0;
      this.vy = 0;
      this.weight = 1;
    }
    restart() {
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.maxFrame = 8;
      this.frameY = 0;
    }
    draw(context) {
      context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height)
    }
    update(input, dt, enemies) {
      //collision detection
      enemies.forEach(enemy => {
        const dx = (enemy.x + enemy.width/2)- (this.x + this.width/2);
        const dy = (enemy.y + enemy.height/2)- (this.y + this.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < enemy.width / 2 + this.width / 2) {
          gameOver = true;
        }
      })

      //sprite animations
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += dt;
      }
      if (input.keys.indexOf("ArrowRight") > -1) {
        this.speed = 5;
      } else if (input.keys.indexOf("ArrowLeft") > -1) {
        this.speed = -5;
      } else if ((input.keys.indexOf("ArrowUp") > -1 || input.keys.indexOf('swipe up') > -1) && this.onGround()) {
        this.vy -= 32
      } else {
        this.speed = 0;
      }

      this.x += this.speed;
      if (this.x < 0) this.x = 0;
      else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

      this.y += this.vy;
      if (!this.onGround()) {
        this.vy += this.weight;
        this.maxFrame = 5;
        this.frameY = 1;
      } else {
        this.vy = 0;
        this.maxFrame = 8;
        this.frameY = 0;
      }
      if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
    }
    onGround() {
      return this.y >= this.gameHeight - this.height;
    }

  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.image = document.getElementById('background');
      this.x = 0;
      this.y = 0;
      this.width = 2400;
      this.handleEnemies = 720;
      this.speed = 7;
    }
    draw(context) {
      context.drawImage(this.image, this.x, this.y);
      context.drawImage(this.image, this.x + this.width - this.speed, this.y);
    }
    update() {
      this.x -= this.speed;
      if (this.x < 0 - this.width) this.x = 0;
    }
    restart() {
      this.x = 0;
    }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 160;
      this.height = 119;
      this.image = document.getElementById('enemy');
      this.x = this.gameWidth;
      this.y = this.gameHeight - this.height;
      this.frameX = 0;
      this.maxFrame = 5;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 8;
      this.markedForDeletion = false;

    }
    draw(context) {
      context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height)
    }
    update(dt) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += dt;
      }
      this.x -= this.speed;
      if (this.x < 0 - this.width) {
        this.markedForDeletion = true;
        score++;
      }
    }
  }

  function handleEnemies(dt) {
    if (enemyTimer > enemyInterval + randomEnemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      randomEnemyInterval = Math.random() * 1000 + 500;
      enemyTimer = 0;
    } else {
      enemyTimer += dt;
    }
    enemies.forEach((enemy) => {
      enemy.draw(ctx);
      enemy.update(dt);
    })
    enemies = enemies.filter(enemy => !enemy.markedForDeletion);
  }

  function displayStatusText(context) {
    context.textAlign = 'left';
    context.font = '30px Helvetica';
    context.fillStyle = 'black';
    context.fillText('Score: ' + score, 20, 50);
    context.fillStyle = 'white';
    context.fillText('Score: ' + score, 23, 53);
    if (gameOver) {
      let sessionHigh = sessionStorage.getItem('sessionHigh') || 0;
      if (score > sessionHigh) {
        sessionStorage.setItem('sessionHigh', score.toString());
        sessionHigh = Number(score);
      }
      let allTimeHighScore = localStorage.getItem('allTimeHighScore') || 0;
      if (score > allTimeHighScore) {
        localStorage.setItem('allTimeHighScore', score.toString());
        allTimeHighScore = Number(score);
      }


      context.textAlign = 'center';
      context.fillStyle = 'black';
      context.fillText('GAME OVER', canvas.width / 2, 80)
      context.fillText('ENTER or SWIPE DOWN to RESTART', canvas.width / 2, 120)
      context.fillText('bSESSION HIGH: ' + sessionHigh, canvas.width / 2, 180)
      context.fillText('ALL-TIME HIGH: ' + allTimeHighScore, canvas.width / 2, 220)


      context.fillStyle = 'white';
      context.fillText('GAME OVER', canvas.width / 2 + 3, 80 + 3)
      context.fillText('ENTER or SWIPE DOWN to RESTART', canvas.width / 2 + 3, 120 + 3)
      context.fillText('bSESSION HIGH: ' + sessionHigh, canvas.width / 2 + 3, 180 + 3)
      context.fillText('ALL-TIME HIGH: ' + allTimeHighScore, canvas.width / 2 + 3, 220 + 3)

    }
  }

  function restartGame() {
    player.restart();
    background.restart();
    enemies = [];
    score = 0;
    gameOver = false;
    animate(0);
  }

  function toggleFullScreen() {
    if (!document.fullscreenbtn) {
      canvas.requestFullscreen().then().catch(err => {
         alert(`Error, cannot enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen();
    }
  }
  fullscreenbtn.addEventListener('click', toggleFullScreen);


  const input = new InputHandler();
  const player = new Player(canvas.width, canvas.height);
  const background = new Background(canvas.width, canvas.height);
  const enemy1 = new Enemy(canvas.width, canvas.height);

  let lastTime = 0;
  let enemyTimer = 0;
  let enemyInterval = 1000;
  let randomEnemyInterval = Math.random() * 1000 + 500;

  function animate(timeStamp) {
    const dt = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.draw(ctx);
    background.update();
    player.draw(ctx);
    player.update(input, dt, enemies);
    handleEnemies(dt)
    displayStatusText(ctx);
    if (!gameOver) requestAnimationFrame(animate);

  }
  animate(0);
});