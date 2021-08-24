// 名前空間(グローバル汚染回避)  // ソースがちょっと読みにくくなる
zr = {};
zr.timeValues = [];
zr.pos;
zr.radar;
zr.map;
zr.speed;
zr.speedValue;

window.onload = function() {

  // レーダー画像の表示範囲
  var lat1 = 20.012500;  var lon1 = 118.015625;
  var lat2 = 47.987500;  var lon2 = 149.984375;
  var bounds = L.latLngBounds([lat1, lon1],[lat2, lon2]);

  // 地図の移動可能範囲
  var maxBounds = [
    [lat1-5, lon1-10],
    [lat2+5, lon2+10]
  ];

  // マップの基本設定
  zr.map = L.map('map', {
    center: [30.40, 130.96],
    zoom: 8,
    minZoom: 5,
    maxZoom: 12,
    maxBounds: maxBounds,
    crs: L.CRS.EPSG3857,
  })

  // ペインを定義し、z-orderを指定
  var pane_border = zr.map.createPane('pane_border');  pane_border.style.zIndex = 650;
  var pane_radar  = zr.map.createPane('pane_radar');   pane_radar.style.zIndex  = 450;

  // 地図タイル
  L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
    attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
  }).addTo(zr.map);

  // 国境線、県境線、市区町村境界線
  try{
    L.tileLayer.mbTiles('./map/border_01.mbtiles', { pane: pane_border }).addTo(zr.map);
    L.tileLayer.mbTiles('./map/border_02.mbtiles', { pane: pane_border }).addTo(zr.map);
    L.tileLayer.mbTiles('./map/border_03.mbtiles', { pane: pane_border }).addTo(zr.map);
  }catch(e){
    // Nothing to do (IEでmbtilesが使用できないことによるエラーを回避)
  }

  // レーダー画像
  zr.radar = new L.ImageOverlay("./img_other/no_img.gif", bounds, {
    opacity: 0.6,
    errorOverlayUrl:'./img_other/no_img.gif',
    interactive: false,
    pane: pane_radar,
  }).addTo(zr.map);

  // 凡例
  var legend_radar = L.control.htmllegend({
    position: 'bottomleft',
    legends: [{
        layer: zr.radar,
        elements: [{ html: '<img class="legend_img" src=./img_other/legend_phh.png></img>' }]
    }],
    disableVisibilityControls: true,
  })
  zr.map.addControl(legend_radar);


  // ********************************************
  // jsonファイル読み込み(レーダー画像の最新時刻を取得)
  // ********************************************
  //$.getJSON("/img_phh/latest_file.json", function (data){
  function dummy(){
  data = { "latest": "2021-08-23T02:00:00" };
    var dt = moment(data.latest);

    // -180分から0分までのファイル名を配列化
    dt.add(-180, "minutes");
    var min = -180;
    while (min <= 0) {
      zr.timeValues.push(dt.format("YYYYMMDDHHmmSS"));
      dt.add(10, "minutes");
      min += 10;
    }

    // スライダの範囲をセット
    // 過去３時間～現在 0 to 36 
    zr.pos = 18;
    document.getElementById("slider").min = 0;
    document.getElementById("slider").max = 18;

    // レーダー画像表示
    changeImg();

    // アニメーションスピードをセット
    zr.speedValue = 3;
    setAnimationSpeed(zr.speedValue);
  }
  dummy();
}


// **************************
// 画像の更新処理
// **************************
function changeImg(){
  // レーダー画像を更新
  var latest_radar_pos = 18;
  var prefix = "./img_phh/";
  zr.radar.setUrl(prefix+zr.timeValues[zr.pos]+".gif");

  // スライダ値を更新
  document.getElementById("slider").value = zr.pos;

  // utc -> localtime
  var yyyy = zr.timeValues[zr.pos].slice(0,4);
  var mm   = zr.timeValues[zr.pos].slice(4,6);
  var dd   = zr.timeValues[zr.pos].slice(6,8);
  var hh   = zr.timeValues[zr.pos].slice(8,10);
  var nn   = zr.timeValues[zr.pos].slice(10,12);
  var utcTime = yyyy+"-"+mm+"-"+dd+" "+hh+":"+nn+":00";
  var localTime= moment.utc(utcTime).local().format('YYYY-MM-DD HH:mm:ss');
  var local_mm = moment(localTime).format('MM');
  var local_dd = moment(localTime).format('DD');
  var local_hh = moment(localTime).format('HH');
  var local_nn = moment(localTime).format('mm');
  var str_time = local_mm+"月"+local_dd+"日 "+local_hh+":"+local_nn;

  // 「実況」を付加
  str_time += " (実況)";
  // 日時を更新
  document.getElementById("sliderLabel").innerHTML = str_time;
}


// **************************
// アニメーション処理
// **************************
var playTimeOut;
function play(){
  playTimeOut = setTimeout(function(){
    changeImg();
    // スライダが最大値に達したら最小値に戻す
    if( zr.pos >= zr.timeValues.length - 1 ){
      zr.pos = 0;
      play();
    }else{
      zr.pos += 1;
      play();
    }
  }, zr.speed);
}

// **************************
// イベント(スライダを動かした時)
// **************************
var slider = document.getElementById("slider");
slider.oninput = function() {
  // ラベルを変更
  zr.pos = Number(this.value);
  console.log(this.value);
  // 画像を変更
  changeImg();
}

// **************************
// イベント(Playボタンクリック時)
// **************************
document.getElementById('play').onclick = function(e){
  $('#play').get(0).style.display = "none";
  $('#stop').get(0).style.display = "inline";
  play();
}

// **************************
// イベント((Stopボタンクリック時)
// **************************
document.getElementById('stop').onclick = function(e){
  $('#play').get(0).style.display = "inline";
  $('#stop').get(0).style.display = "none";
  clearTimeout(playTimeOut);
  playTimeOut = null;
}

// **************************
// イベント(backボタンクリック時)
// **************************
document.getElementById('back').onclick = function(e){
  // play中は処理しない
  if (playTimeOut > 0){ return };
  // スライダが最小値に達していたら処理しない
  if( zr.pos <= 0 ){ 
    zr.pos = 0;
    return;
  }
  // 1コマ前の画像を表示（スライダ、ラベル、画像を更新）
  zr.pos -= 1;
  changeImg();
}

// **************************
// イベント(forwardボタンクリック時)
// **************************
document.getElementById('forward').onclick = function(e){
  // play中は処理しない
  if (playTimeOut > 0){ return };
  // スライダが最大値に達していたら処理しない
  if( zr.pos >= zr.timeValues.length - 1 ){
    zr.pos = zr.timeValues.length - 1;
    return;
  }
  // 1コマ先の画像を表示（スライダ、ラベル、画像を更新）
  zr.pos += 1;
  changeImg();
}

// **************************
// アニメーションスピードをセット
// **************************
function setAnimationSpeed(n){
  // 表示ボタンのデザインを更新
  $(".reception").css('display', 'none');
  var next_id = "#reception-" + n;
  $(next_id).get(0).style.display = "inline";
  // アニメーションスピードを更新
  switch (n) {
    case 1:
      zr.speed = 800;
      break;
    case 2:
      zr.speed = 500;
      break;
    case 3:
      zr.speed = 300;
      break;
    case 4:
      zr.speed = 100;
      break;
  }
}

// **************************
// イベント(amimationSpeedボタンクリック時)
// **************************
document.getElementById('animationSpeed').onclick = function(){
  zr.speedValue += 1;
  if ( zr.speedValue >= 5 ){
    zr.speedValue = 1;
  }
  setAnimationSpeed(zr.speedValue);
}

