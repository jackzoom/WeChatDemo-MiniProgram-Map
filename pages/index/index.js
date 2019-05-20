//index.js
//获取应用实例
const QQMapWx = require('../../utils/qqmap-wx-jssdk.js')
//访问微信小程序JavaScript SDK 申请接口key
//https://lbs.qq.com/qqmap_wx_jssdk/index.html
var mapsComp = new QQMapWx({
  key: 'HKIBZ-3MS6V-QMBPA-UH4JT-TINZV-DPF2M'
})
const app = getApp()
Page({
  data: {
    sigInData: {},
    signInPoint: {}, //打卡工地坐标
    locationDot: {
      long: '',
      lat: ''
    },
    mapCircles: [{
      latitude: '',
      longitude: '',
      color: '#1aaba8',
      radius: 2000,
      fillColor: '#7cb5ec88'
    }],
    mapSignText: '定位中', //打卡按钮文案
    mapSignType: -1, //打卡状态：[-1:定位中,-1：外勤,1：正常打卡]
    mapMarkers: [],
    mapRadius: '',
    mapScale: 13
  },
  onLoad: function() {
    var that = this;
    this.mapCtx = wx.createMapContext('sign-map');
    that.requestWorksPoint(function() {
      that.autoGetLocation();
      that.setWorksCenterMaker();
    });
  },
  setWorksCenterMaker: function() {
    var that = this;
    var point = that.data.signInPoint;
    var markers = {
      id: 0,
      latitude: point.lat,
      longitude: point.long,
      height: 25,
      name: "光大会展",
      callout: {
        content: "光大会展",
        padding: 5,
        bgColor: '#1aaba8',
        color: '#ffffff',
        display: 'ALWAYS',
        textAlign: 'center',
        borderRadius: 5,
      }
    };
    that.setData({
      mapMarkers: [markers]
    })
  },
  requestWorksPoint: function(fn) { //请求工地定位点
    var that = this;
    //模拟工地定位地点坐标
    var mockPoint = {
      long: '121.42813',
      lat: '31.16745'
    }
    that.setData({
      signInPoint: mockPoint
    })
    typeof(fn) == 'function' && fn();
  },
  autoGetLocation: function() { //首次加载获取当前位置信息
    var that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        console.log(res);
        that.setData({
          'locationDot.long': res.longitude,
          'locationDot.lat': res.latitude,
          'mapCircles[0].longitude': that.data.signInPoint.long,
          'mapCircles[0].latitude': that.data.signInPoint.lat,
        })
        that.getDetailMaps();
      },
    })
  },
  locationTap: function(e) { //手动定位按钮 
    var that = this;
    that.setData({
      mapScale: 14
    })
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        console.log(res);
        that.setData({
          // mapSignType: 0,
          mapSignText: '定位中',
          'locationDot.long': res.longitude,
          'locationDot.lat': res.latitude,
        })
        that.mapCtx.moveToLocation();
        that.getDetailMaps();
        that.setMapAutoScale();
      },
    })
  },
  getDetailMaps: function() { //获取当前点地理信息
    var that = this;
    mapsComp.reverseGeocoder({
      location: {
        latitude: that.data.locationDot.lat,
        longitude: that.data.locationDot.long
      },
      success: function(res) {
        //console.log(res);       
        that.setData({
          sigInData: res.result
        })
        setTimeout(function() {
          that.getSignTapData();
        }, 500);
      },
      fail: function(res) {
        console.log(res);
      },
    })
  },
  getSignTapData: function() {
    var circles = this.data.mapCircles[0];
    var distance = this.getDistance();
    var val = '',
      text = '';
    val = distance <= circles.radius ? 1 : -1;
    text = val == 1 ? '打卡' : '外勤';
    this.setData({
      mapSignType: val,
      mapSignText: text
    })
  },
  getDistance: function() { //获取定位点到范围中心距离
    var that = this;
    var circles = that.data.mapCircles[0];
    var local = that.data.locationDot;
    var distance = that.calcDistance(circles.latitude, circles.longitude, local.lat, local.long);
    return distance
  },
  signInTap: function(e) { //打卡签到按钮
    var that = this;
    var circles = that.data.mapCircles[0];
    // var local = that.data.locationDot;
    // var distance = that.calcDistance(circles.latitude, circles.longitude, local.lat, local.long);
    var distance = that.getDistance();
    if (distance <= circles.radius) {
      console.log("打卡成功！距离：", distance);
      wx.showModal({
        title: '打卡成功！',
        content: '地址：' + that.data.sigInData.address,
        showCancel: false,
        confirmText: '完成',
        success: function() {

        }
      })
    } else {
      console.log("外勤打卡！距离：", distance);
      that.poiChangeAddress(that.data.signInPoint, function(res) {
        var content = "您当前位置：" + that.data.sigInData.address + "\r\n";
        content += "工地位置：" + res.address;
        wx.showModal({
          title: '外勤打卡提示',
          content: content,
          cancelText: '重新定位',
          confirmText: '继续打卡',
          success: function(res) {
            res.confirm ? wx.showToast({
              title: '打卡成功！',
            }) : that.locationTap();
          }
        })
      })

    }
  },
  mapScaleSub: function() { //手动按钮缩放减
    var that = this;
    this.mapCtx.getScale({
      success: function(res) {
        console.log(res);
        that.setData({
          mapScale: res.scale - 1
        })
      }
    })
  },
  mapScalePlus: function() { //手动按钮缩放加
    var that = this;
    this.mapCtx.getScale({
      success: function(res) {
        console.log(res);
        that.setData({
          mapScale: res.scale + 1
        })
      }
    })
  },
  calcDistance: function(lat1, lng1, lat2, lng2) { //计算两点距离：m
    lat1 = lat1 || 0;
    lng1 = lng1 || 0;
    lat2 = lat2 || 0;
    lng2 = lng2 || 0;
    var rad1 = lat1 * Math.PI / 180.0;
    var rad2 = lat2 * Math.PI / 180.0;
    var a = rad1 - rad2;
    var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    var r = 6378137;
    var distance = r * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(rad1) * Math.cos(rad2) * Math.pow(Math.sin(b / 2), 2)));
    return distance;
  },
  poiChangeAddress: function(location, fn) { //坐标转地址
    var that = this;
    location = location || {
      lat: 0,
      lng: 0
    };
    mapsComp.reverseGeocoder({
      location: location.lat + "," + location.long,
      success: function(res) {
        console.log("坐标匹配地址：", res.result);
        typeof(fn) == 'function' && fn(res.result)
      }
    })
  },
  getZmPoiTap: function() { //地址转换坐标
    mapsComp.geocoder({       //获取表单传入地址            
      address: "上海市徐汇区漕宝路80号", //地址参数
      success: function(res) { //成功后的回调                
        console.log(res);
        wx.showModal({
          title: '上海市徐汇区漕宝路80号',
          content: "坐标：" + res.result.location.lat + "\r\n" + res.result.location.lng,
        })
      }
    })
  },
  getMapCenterTap: function() { //获取屏幕中心坐标
    this.mapCtx.getCenterLocation({
      success: function(res) {
        console.log("屏幕中心坐标：", res);
        wx.showModal({
          title: '屏幕中心坐标',
          content: res.latitude + "\r\n" + res.longitude,
        })
      }
    })
  },
  setMapAutoScale: function() {
    var that = this;
    var point = that.data.signInPoint;
    var location = that.data.locationDot;
    var distance = that.calcDistance(point.lat, point.long, location.lat, location.long)
    console.log("当前距离：", distance);
    that.mapCtx.getRegion({
      success: res => {

      }
    });
  }
})