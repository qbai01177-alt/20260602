let stars = [];
// 定義指定的調色盤
const palette = ['#7bdff2', '#b2f7ef', '#eff7f6', '#f7d6e0', '#f2b5d4'];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 產生 40 個星星物件
  for (let i = 0; i < 40; i++) {
    stars.push(new Star());
  }
}

function draw() {
  background(30); // 深色背景讓柔和顏色的星星更明顯
  
  for (let star of stars) {
    star.update();
    star.display();
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

    // 更新位置
    this.x += this.vx;
    this.y += this.vy;

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