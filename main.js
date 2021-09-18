// 名前空間(グローバル汚染回避) 
zr = {};
zr.pos;
zr.radar;
zr.map;
zr.speed;
zr.speedValue;

window.onload = function() {

  // レーダー画像の表示範囲
  var lat1 = 20.004167;  var lon1 = 118.006250;
  var lat2 = 47.995833;  var lon2 = 149.993750;
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
  zr.radar = new L.ImageOverlay("./img_other/no_image.gif", bounds, {
    opacity: 0.6,
    errorOverlayUrl:'./img_other/no_image.gif',
    interactive: false,
    pane: pane_radar,
  }).addTo(zr.map);

  // 凡例
  var legend_radar = L.control.htmllegend({
    position: 'bottomleft',
    legends: [{
        layer: zr.radar,
        elements: [{ html: '<img class="legend_img" src=/img_other/legend_prr.png></img>' }]
    }],
    disableVisibilityControls: true,
  })
  zr.map.addControl(legend_radar);

  display_img();
}


// ******************************
// 画像のファイルリスト(レーダー、ナウキャスト、短時間)を取得し、表示画像リストを作成
// ******************************
function display_img(){

  zr.img_list = []; // 画像リストの初期化
  $.ajaxSetup({async: false}); // 同期通信でjsonを取得

  // レーダー画像のファイルリストを作成
  //$.getJSON("/img_prr/latest_file.json", function (data){
    data = { "latest": "2021-09-17T08:45:00" }
    // レーダー画像の最新日時 -180分 から 5分毎に +0分 までのファイル名をリストに追加
    var dt_latest = moment(data["latest"]);
    var dt = moment(data["latest"]).add(-180, "minutes");
    while ( dt <= dt_latest ) {
      dt_format = dt.format("YYYYMMDDHHmmSS");
      zr.img_list.push("./img_prr/"+dt_format+".gif");
      dt.add(5, "minutes");
    }
  //})

  // 降水ナウキャスト画像のファイルリストを作成
  //$.getJSON("/img_nowc/latest_file.json", function (data){
    data = {
      "ft1": "2021-09-17T08:45:00",
      "ft2": "2021-09-17T08:50:00",
      "ft3": "2021-09-17T08:55:00",
      "ft4": "2021-09-17T09:00:00",
      "ft5": "2021-09-17T09:05:00",
      "ft6": "2021-09-17T09:10:00",
      "ft7": "2021-09-17T09:15:00",
      "ft8": "2021-09-17T09:20:00",
      "ft9": "2021-09-17T09:25:00",
      "ft10": "2021-09-17T09:30:00",
      "ft11": "2021-09-17T09:35:00",
      "ft12": "2021-09-17T09:40:00",
    }
    // 画像リスト末尾の日時を取得
    var path = zr.img_list[zr.img_list.length-1]; // リストの末尾を取得
    var fname = path.match(/([^/]+)\./)[1];       // ファイル名のみ抽出
    var prr_dt_format = fname.split(".")[0];     // 拡張子を除外

    // +5分 から +60分 まで 5分毎 のファイル名をリストに追加
    for (var t=1 ; t<=12; t++) {
      // レーダー画像と同日時または過去日時は、リストから除外
      var dt = moment(data["ft"+t]);
      var dt_format = dt.format("YYYYMMDDHHmmSS");
      if (dt_format > prr_dt_format){
        zr.img_list.push("./img_nowc/"+dt_format+".gif");
      }
    }
  //})

  // 短時間降水予想画像のファイルリストを作成
  //$.getJSON("/img_anfh/latest_file.json", function (data){
    data = {
      "ft1": "2021-09-17T09:00:00",
      "ft2": "2021-09-17T10:00:00",
      "ft3": "2021-09-17T11:00:00",
      "ft4": "2021-09-17T12:00:00",
      "ft5": "2021-09-17T13:00:00",
      "ft6": "2021-09-17T14:00:00",
    }
    // 画像リスト末尾の日時を取得
    var path = zr.img_list[zr.img_list.length-1]; // リストの末尾を取得
    var fname = path.match(/([^/]+)\./)[1];       // ファイル名のみ抽出
    var nowc_dt_format = fname.split(".")[0];     // 拡張子を除外

    // +60分 から +360分 まで 60分毎 のファイル名をリストに追加
    for (var t=1 ; t<=6; t++) {
      // ナウキャスト画像と同日時または過去日時は、リストから除外
      var dt = moment(data["ft"+t]);
      var dt_format = dt.format("YYYYMMDDHHmmSS");
      if (dt_format > nowc_dt_format){
        zr.img_list.push("./img_anfh/"+dt_format+".gif");
      }
    }
  //})

  // 画像表示
  // スライダの範囲をセット
  zr.pos = 36;
  document.getElementById("slider").min = 0;
  document.getElementById("slider").max = zr.img_list.length - 1;

  // レーダー画像表示
  changeImg();

  // アニメーションスピードをセット
  zr.speedValue = 3;
  setAnimationSpeed(zr.speedValue);
}


// **************************
// 画像の更新処理
// **************************
function changeImg(){
  // レーダー画像を更新
  zr.radar.setUrl(zr.img_list[zr.pos]);

  // スライダ値を更新
  document.getElementById("slider").value = zr.pos;

  // utc -> localtime
  var fname = zr.img_list[zr.pos].split("/")[2];
  var yyyy = fname.slice(0,4);
  var mm   = fname.slice(4,6);
  var dd   = fname.slice(6,8);
  var hh   = fname.slice(8,10);
  var nn   = fname.slice(10,12);
  var utcTime = yyyy+"-"+mm+"-"+dd+" "+hh+":"+nn+":00";
  var localTime = moment.utc(utcTime).local().format('YYYY-MM-DD HH:mm:ss');
  var local_mm = moment(localTime).format('MM');
  var local_dd = moment(localTime).format('DD');
  var local_hh = moment(localTime).format('HH');
  var local_nn = moment(localTime).format('mm');
  var str_time = local_mm+"月"+local_dd+"日 "+local_hh+":"+local_nn;

  // 実況 or 予想 を付加
  var latest_radar_pos = 36;
  if (zr.pos <= latest_radar_pos){
    str_time += " (実況)";
  }else{
    str_time += " (予想)";
  }
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
    if( zr.pos >= zr.img_list.length - 1 ){
      zr.pos = 0;
      play();
    }else{
      zr.pos += 1;
      play();
    }
    // スライダが最大値に達したら最小値に戻す
  }, zr.speed);
}

// **************************
// イベント(スライダを動かした時)
// **************************
var slider = document.getElementById("slider");
slider.oninput = function() {
  // ラベルを変更
  zr.pos = Number(this.value);
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
  if( zr.pos >= zr.img_list.length - 1 ){
    zr.pos = zr.img_list.length - 1;
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


// **************************
// イベント(自動更新スイッチを切り替えた時)
// **************************
var cbox = document.getElementById("customSwitches");
cbox.oninput = function() {
  var ret = this.checked;
  if (ret == true){
    auto_reoad();
  }else{
    clearTimeout(ps_autoreload);
    ps_autoreload = null;
  }
}

// **************************
// 自動更新処理
// **************************
var ps_autoreload;
function auto_reoad(){
  ps_autoreload = setTimeout(function(){
    console.log("reload!!!");
    console.log(zr.img_list[0]);
    display_img();
    auto_reoad();
  }, 5*1000);
}


