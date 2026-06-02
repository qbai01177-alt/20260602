let stars = [];
let missiles = [];
let particles = [];
// 定義指定的調色盤
const palette = ['#7bdff2', '#b2f7ef', '#eff7f6', '#f7d6e0', '#f2b5d4'];

let score = 0;
let timeLeft = 30;
let gameState = 'PLAYING'; // 狀態分為: PLAYING, GAMEOVER, ENDED
let lastTickTime = 0;
let lastSpawnTime = 0; // 記錄上一次新增星星的時間

function setup() {
  createCanvas(windowWidth, windowHeight);
  initGame();
}

// 將初始化邏輯獨立出來，方便玩家選擇「重新開始」時呼叫
function initGame() {
  stars = [];
  missiles = [];
  particles = [];
  score = 0;
  timeLeft = 30;
  gameState = 'PLAYING';
  lastTickTime = millis();
  lastSpawnTime = millis();
  
  // 產生 40 個星星物件
  for (let i = 0; i < 40; i++) {
    stars.push(new Star());
  }
}

function draw() {
  background(30); // 深色背景讓柔和顏色的星星更明顯
  
  if (gameState === 'PLAYING') {
    // 倒數計時邏輯 (每經過 1000 毫秒扣 1 秒)
    if (millis() - lastTickTime >= 1000) {
      timeLeft--;
      lastTickTime = millis();
    }

    // 時間到判定
    if (timeLeft <= 0) {
      gameState = 'GAMEOVER';
      // 使用 setTimeout 延遲 50 毫秒，確保 P5 可以先將 GAME OVER 畫面印出再阻擋主執行緒
      setTimeout(() => {
        let restart = confirm(`時間到！你的分數是 ${score} 分。\n是否要重新開始遊戲？`);
        if (restart) {
          initGame();
        } else {
          gameState = 'ENDED';
        }
      }, 50);
    }

    // 隨著時間減少，加快新增星星的頻率 (將 30~0 秒，映射到 2000~300 毫秒生成一顆)
    let spawnDelay = map(timeLeft, 30, 0, 2000, 300, true);
    if (millis() - lastSpawnTime > spawnDelay) {
      stars.push(new Star());
      lastSpawnTime = millis();
    }

    // 逆向迴圈以便在碰撞時能安全刪除陣列內的星星
    for (let i = stars.length - 1; i >= 0; i--) {
      let star = stars[i];
      star.update();
      star.display();
    }

    // 更新與繪製飛彈，並偵測碰撞
    for (let i = missiles.length - 1; i >= 0; i--) {
      let m = missiles[i];
      m.update();
      m.display();

      // 若飛彈飛出邊界則移除
      if (m.isOffScreen()) {
        missiles.splice(i, 1);
        continue;
      }

      // 飛彈與星星的碰撞偵測
      let hit = false;
      for (let j = stars.length - 1; j >= 0; j--) {
        let s = stars[j];
        // 星星的視覺半徑大約是 size * 0.7
        if (dist(m.x, m.y, s.x, s.y) < s.size * 0.7 + m.r) {
          createExplosion(s.x, s.y, s.color); // 產生爆炸
          stars.splice(j, 1);                 // 刪除星星
          score += 10;                        // ★ 每打爆一顆星星加 10 分
          hit = true;
          break; // 一發飛彈只會擊中一顆星星
        }
      }
      // 擊中星星後刪除飛彈
      if (hit) {
        missiles.splice(i, 1);
      }
    }

    // 更新與繪製爆炸粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.update();
      p.display();
      if (p.life <= 0) particles.splice(i, 1);
    }

    // 繪製中心點的箭頭
    drawArrow();
    
    // ★ 顯示左上角的分數與時間 UI
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(24);
    text(`分數: ${score}`, 20, 20);
    
    // ★ 倒數 5 秒內，時間文字變成紅色且閃爍警告
    if (timeLeft <= 5 && millis() % 500 < 250) {
      fill(255, 50, 50); // 閃爍時顯示紅色
    } else {
      fill(255);         // 一般狀態或閃爍交替顯示白色
    }
    
    text(`時間: ${timeLeft} 秒`, 20, 50);

  } else if (gameState === 'GAMEOVER') {
    // 顯示遊戲結束字樣 (時間到的一瞬間)
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(64);
    text("GAME OVER", width / 2, height / 2 - 20);
  } else if (gameState === 'ENDED') {
    // 玩家選擇不繼續玩之後的總結畫面
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(48);
    text("遊戲結束，感謝遊玩！", width / 2, height / 2 - 20);
    textSize(32);
    text(`最終分數: ${score} 分`, width / 2, height / 2 + 40);
  }
}

// 繪製跟隨游標轉向的中心箭頭
function drawArrow() {
  push();
  translate(width / 2, height / 2);
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  
  fill(200);
  stroke(255);
  strokeWeight(2);
  
  // 畫出箭頭的形狀 (尖端朝向 0 度方向，也就是右側)
  beginShape();
  vertex(20, 0);
  vertex(-10, 15);
  vertex(-5, 0);
  vertex(-10, -15);
  endShape(CLOSE);
  
  pop();
}

// 偵測滑鼠點擊發射飛彈
function mousePressed() {
  // 只有在遊玩狀態且點擊左鍵時，才能發射飛彈
  if (gameState === 'PLAYING' && mouseButton === LEFT) {
    missiles.push(new Missile(width / 2, height / 2, mouseX, mouseY));
  }
}

// 產生爆炸效果的函式
function createExplosion(x, y, c) {
  // 產生 30 個向外擴散的爆炸粒子
  for (let i = 0; i < 30; i++) {
    particles.push(new Particle(x, y, c));
  }
}

// 當視窗改變大小時，重製畫布尺寸
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Star {
  constructor() {
    // 亂數產生大小、位置、速度與顏色
    this.baseSize = random(40, 90);
    this.size = this.baseSize;
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.originalVx = this.vx;
    this.originalVy = this.vy;
    this.color = color(random(palette));
    
    this.isSurprised = false;
    this.wasSurprised = false;
  }

  update() {
    // 計算與滑鼠的距離
    let d = dist(this.x, this.y, mouseX, mouseY);
    
    // 滑鼠靠近判定
    this.isSurprised = d < 150;

    if (this.isSurprised) {
      // 當剛進入驚嚇狀態時，給予一個強烈的反向跳動力道
      if (!this.wasSurprised) {
        let angle = atan2(this.y - mouseY, this.x - mouseX);
        this.vx += cos(angle) * 15;
        this.vy += sin(angle) * 15;
      }
      // 在驚嚇狀態下加入一點摩擦力，讓跳動後稍微減速
      this.vx *= 0.95;
      this.vy *= 0.95;
    } else {
      // 沒有被驚嚇時，漸漸恢復原本的漂浮速度
      this.vx = lerp(this.vx, this.originalVx, 0.05);
      this.vy = lerp(this.vy, this.originalVy, 0.05);
    }
    
    this.wasSurprised = this.isSurprised;

    // 根據剩餘時間計算速度加成 (從 1 倍加速到最高 3.5 倍，確保在合法範圍內)
    let speedMult = map(timeLeft, 30, 0, 1, 3.5, true);
    // 更新位置時套用速度加成
    this.x += this.vx * speedMult;
    this.y += this.vy * speedMult;

    // 邊界判定：超出畫面時從另一端出現
    if (this.x < -this.size) this.x = width + this.size;
    if (this.x > width + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = height + this.size;
    if (this.y > height + this.size) this.y = -this.size;
  }

  display() {
    push();
    translate(this.x, this.y);

    // 畫出圓角星星身體 (利用極座標與餘弦函數)
    fill(this.color);
    noStroke();
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.05) {
      let r = this.size * 0.7 + this.size * 0.3 * cos(5 * a - HALF_PI);
      vertex(r * cos(a), r * sin(a));
    }
    endShape(CLOSE);

    // 設定眼睛與眼球的大小 (依據是否驚嚇改變)
    let eyeRadius = this.isSurprised ? this.size * 0.35 : this.size * 0.25;
    let pupilRadius = this.isSurprised ? this.size * 0.18 : this.size * 0.12;
    
    let eyeOffsetX = this.size * 0.25;
    let eyeOffsetY = -this.size * 0.1;

    // 繪製左右眼
    this.drawEye(-eyeOffsetX, eyeOffsetY, eyeRadius, pupilRadius);
    this.drawEye(eyeOffsetX, eyeOffsetY, eyeRadius, pupilRadius);

    // 畫出嘴巴
    stroke(50);
    strokeWeight(this.size * 0.05);
    if (this.isSurprised) {
      // 驚嚇時：圓形嘴巴 (O型嘴)
      fill(50);
      noStroke();
      circle(0, this.size * 0.25, this.size * 0.3);
    } else {
      // 一般時：圓弧微笑
      noFill();
      arc(0, this.size * 0.1, this.size * 0.4, this.size * 0.3, 0, PI);
    }

    pop();
  }

  // 繪製單邊眼睛的函數
  drawEye(ex, ey, eRad, pRad) {
    // 眼白
    fill(255);
    noStroke();
    circle(ex, ey, eRad);

    // 眼球 (黑色) - 會計算跟著滑鼠游標的位置
    // 取得這隻眼睛與滑鼠的相對角度
    let angleToMouse = atan2(mouseY - (this.y + ey), mouseX - (this.x + ex));
    // 限制眼球移動的最遠距離，避免眼球跑出眼白
    let maxDist = (eRad - pRad) / 2; 
    
    let px = ex + cos(angleToMouse) * maxDist;
    let py = ey + sin(angleToMouse) * maxDist;

    fill(30);
    circle(px, py, pRad);
  }
}

// 飛彈 Class
class Missile {
  constructor(startX, startY, targetX, targetY) {
    this.x = startX;
    this.y = startY;
    this.r = 6; // 飛彈半徑
    let angle = atan2(targetY - startY, targetX - startX);
    let speed = 18; // 飛彈速度
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.history = []; // 用來儲存拖影路徑
  }

  update() {
    this.history.push(createVector(this.x, this.y));
    if (this.history.length > 8) {
      this.history.shift(); // 限制拖影的殘影長度
    }
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    // 繪製螢光黃色的拖影
    noFill();
    stroke(204, 255, 0, 150); 
    strokeWeight(this.r * 2);
    beginShape();
    for (let v of this.history) {
      vertex(v.x, v.y);
    }
    endShape();

    // 繪製飛彈本體
    fill(204, 255, 0);
    noStroke();
    circle(this.x, this.y, this.r * 2);
  }

  isOffScreen() {
    return (this.x < 0 || this.x > width || this.y < 0 || this.y > height);
  }
}

// 爆炸粒子 Class
class Particle {
  constructor(x, y, baseColor) {
    this.x = x;
    this.y = y;
    // 給予隨機的向外爆發速度
    this.vx = random(-8, 8);
    this.vy = random(-8, 8);
    this.life = 255; // 粒子的生命週期(透明度)
    this.color = baseColor;
    this.size = random(4, 10);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 12; // 粒子逐漸變透明消失
  }

  display() {
    noStroke();
    // 沿用被擊中星星的顏色，並套用漸隱效果
    fill(red(this.color), green(this.color), blue(this.color), this.life);
    circle(this.x, this.y, this.size);
  }
}