const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 计算地图圆半径
var EARTH_RADIUS = 6378.137; //地球半径
function getRad(d) {
  return d * Math.PI / 180.0;
}
// 弃用
const getDistance = function(lng1, lat1, lng2, lat2) {
  var radLat1 = getRad(lat1);
  var radLat2 = getRad(lat2);
  var a = radLat1 - radLat2;
  var b = getRad(lng1) - getRad(lng2);
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.pow(Math.sin(b / 2), 2)));
  s = s * EARTH_RADIUS;
  s = Math.round(s * 10000) / 10000;
  return s; //返回数值单位：公里
}

module.exports = {
  formatTime: formatTime,
  getDistance: getDistance
}