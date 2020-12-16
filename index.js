"user strict";

// ブラウザ判定．Chromeでアクセスするように促す．
const userAgent = window.navigator.userAgent.toLowerCase();
if (userAgent.indexOf('chrome') === -1) {
    alert('Google Chromeでアクセスしてください')
    document.getElementById('status').innerHTML = "Google Chromeでアクセスしてください";
    document.getElementById('status').className = "error";
    // exit;
}

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();


// ランダムな方向に移動するパーティクル
// 参照 https://www.webopixel.net/javascript/1271.html
window.onload = function() {
    const canvasWrap = document.querySelector('#canvas-wrap');
    const canvas = document.querySelector('#canvas-container');
    const ctx = canvas.getContext('2d');

    const center = {};    // Canvas中央
    const dots = [];      // パーティクル配列
    const density = 300;  // パーティクルの数
    const palettes = [
        ['#eeb900', '#6DD0A5', '#f799db'],                                   // オレンジ・緑・赤
        ['#3366ff', '#0099ff', '#33cccc', '#00ff99', '#33cc33'],             // 暗い色 (青系)
        ['#ccccff', '#ccffff', '#ccffcc', '#ccffcc', '#ffcccc', '#ffffcc'],  // 薄い色
        ['#ccff66', '#99ff99', '#66ffcc', '#66ccff', '#9999ff', '#ffccff'],  // 明るい色
    ];
    const colors = palettes[3];
    const baseSize = 3;    // 大きさ
    const baseSpeed = 10;  // スピード

    const Dot = function () {
        this.size = Math.floor(Math.random() * 6) + baseSize;   // 大きさ
        this.color = colors[~~(Math.random() * colors.length)];    // 色
        this.speed = this.size / baseSpeed;                        // 大きさによって速度変更
        this.pos = {  // 位置
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };
        const rot = Math.random() * 360;  // ランダムな角度
        const angle = rot * Math.PI / 180;

        this.vec = {    // 移動方向
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };
    };
    Dot.prototype = {
        update: function() {
            this.draw();

            this.pos.x += this.vec.x;
            this.pos.y += this.vec.y;

            // 画面外に出たら反対へ再配置
            if(this.pos.x > canvas.width + 10) {
                this.pos.x = -5;
            } else if(this.pos.x < 0 - 10) {
                this.pos.x = canvas.width + 5;
            } else if(this.pos.y > canvas.height + 10) {
                this.pos.y = -5;
            } else if(this.pos.y < 0 - 10) {
                this.pos.y = canvas.height + 5;
            }
        },

        draw: function() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.size, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    };

    function update() {
        requestAnimFrame(update);
        // 描画をクリア
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < density; i++) {
            dots[i].update();
        }
    }

    function init() {
        // canvas にコンテンツサイズをセット
        canvas.setAttribute("width", canvasWrap.offsetWidth);
        canvas.setAttribute("height", canvasWrap.offsetHeight);

        // canvas 中央をセット
        center.x = canvas.width / 2;
        center.y = canvas.height / 2;

        // density の数だけパーティクルを生成
        for (let i = 0; i < density; i++) {
            dots.push(new Dot());
        }
        update();
    }
    init();
}


// getUserMedia() で画面の映像を取得する
// 参照 https://qiita.com/miyataku/items/5b694c139d7e91ddbe83
const mediaStreamConstraints = {
    video: true
};

// ストリームが読み込まれる動画要素
const localVideo = document.querySelector("video");

// 動画で再生される localStream
let localStream;

// ウィンドウの中心座標とサイズ
let centerX;
let centerY;
let viewWidth;
let viewHeight;

function gotLocalMediaStream(mediaStream) {
    localStream = mediaStream;
    localVideo.srcObject = mediaStream;
    centerX = (document.getElementById("shared-video").clientWidth - viewWidth) / 2;
    centerY = (document.getElementById("shared-video").clientHeight - viewHeight) / 2;
    scrollRandom();
}

function handleLocalMediaStreamError(error) {
    console.log("navigator.getUserMedia error: ", error);
}

// 左上から時計回りに 8 種類の方向．
const directions = [
    [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]
];
let directionsIndex;

// 前回のフレームでの座標
let prevX;
let prevY;

// スクロールの次の方向を決める．
function nextDirection() {
    const wx = window.scrollX;  // 現在のウィンドウのスクロール位置．左端が 0．
    const wy = window.scrollY;
    let dx = wx - prevX;
    let dy = wy - prevY;

    // 一定の確率 p(%) で進行方向を変える．
    let p = 10;
    if (Math.random() * 100 < p) {
        directionsIndex = (directionsIndex + 1) % 8;
        dx = directions[directionsIndex][0];
        dy = directions[directionsIndex][1];
    }

    // 画面の端に近づいたら，中心方向に軌道修正
    if (Math.random() * 100 < 90) {
        if (wx < centerX/2 && dx <= 0) {
            directionsIndex = 3;  // 右向き
            dx = directions[directionsIndex][0];
            if (Math.random() * 100 < 30) {
                dx *= 2;
            }
        } else if (centerX*3/2 < wx && dx >= 0) {
            directionsIndex = 7;  // 左向き
            dx = directions[directionsIndex][0];
            if (Math.random() * 100 < 30) {
                dx *= 2;
            }
        }
        if (wy < centerY/2 && dy >= 0) {
            directionsIndex = 5;  // 下向き
            dy = directions[directionsIndex][1];
            if (Math.random() * 100 < 30) {
                dy *= 2;
            }
        } else if (centerY*3/2 < wy && dy <= 0) {
            directionsIndex = 1;  // 上向き
            dy = directions[directionsIndex][1];
            if (Math.random() * 100 < 30) {
                dy *= 2;
            }
        }
    }

    prevX = window.scrollX;
    prevY = window.scrollY;
    centerX = (document.getElementById("shared-video").clientWidth - viewWidth) / 2;
    centerY = (document.getElementById("shared-video").clientHeight - viewHeight) / 2;

    return [dx, dy]
    // return [0, 0]

}


// MediaStream を初期化
// Chrome 以外にも対応したい https://qiita.com/massie_g/items/f852680b16c1b14cb9e8
navigator.mediaDevices
    .getDisplayMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream)
    .catch(handleLocalMediaStreamError);


// スクロール位置に関する変数
centerX = 0;
centerY = 0;
viewWidth = document.documentElement.clientWidth;
viewHeight = document.documentElement.clientHeight;
directionsIndex = 0;
prevX = window.scrollX;
prevY = window.scrollY;

// 更新速度
const interval = 60;  // 何ミリ秒おきに更新するか
const move = 1;

// 表示領域の何倍の映像として表示するか
const videoScales = [2, 0.99, 1.1];
let videoScalesIndex = 0;


function scrollRandom() {
    [diffX, diffY] = nextDirection();
    window.scrollBy(diffX, diffY);  // スクロール処理
    setTimeout("scrollRandom()", interval);
}

function changeVideoSize() {
    videoScalesIndex = (videoScalesIndex + 1) % videoScales.length;
    console.log("changed to " + String(videoScalesIndex));
    viewWidth = document.documentElement.clientWidth;
    viewHeight = document.documentElement.clientHeight;
    document.getElementById("shared-video").style.width = String(viewWidth * videoScales[videoScalesIndex]) + "px";
    centerX = (document.getElementById("shared-video").clientWidth - viewWidth) / 2;
    centerY = (document.getElementById("shared-video").clientHeight - viewHeight) / 2;
    switch (videoScalesIndex) {
        case 0:
            setTimeout("changeVideoSize()", 10000);
            break;
        case 1:
            setTimeout("changeVideoSize()", 5000);
            break;
        case 2:
            window.scrollTo(centerX-30, centerY);
            setTimeout("changeVideoSize()", 15000);
            break;
        default:
            setTimeout("changeVideoSize()", 5000);
    }
}

changeVideoSize()
