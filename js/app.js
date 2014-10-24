// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {

  // We'll ask the browser to use strict code to help us catch errors earlier.
  // https://developer.mozilla.org/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
  'use strict';

  var translate = navigator.mozL10n.get;

  var button = document.getElementById('scan-button');
  var errtxt = document.getElementById('message');

  var MS_TO_S = 1/1000;
  var BEACON_PING = 'PING';
  var BEACON_PONG = 'PONG';
  var BEACON_PORT = 9903;
  var BEACON_INTERVAL = 5000;
  var MULTICAST_ADDRESS = '224.0.0.255';

  var socket = null;
  var message = null;
  var devices = {};
  var device_list = document.getElementById('device-list');

  function updateDeviceList() {
    var now = Date.now();
    while(device_list.firstChild) {
      device_list.removeChild(device_list.firstChild);
    }

    for(var addr in devices) {
      var item = document.createElement('li');
      var dt = Math.floor((now - devices[addr]) * MS_TO_S);
      var str;
      if(dt > 10)  {
        str = '<del>' + addr + '</del>';
      } else {
        str = addr;
      }

      item.innerHTML = str;
      device_list.appendChild(item);
    }
  }

  function receiveMessage(msg) {
    var data = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(msg.data)));

    if(!devices.hasOwnProperty(msg.remoteAddress)) {
      devices[msg.remoteAddress] = {
        lastSeen: null,
        latency: null
      };
    }
    devices[msg.remoteAddress] = Date.now();
    updateDeviceList();

    if('PING' == data.type) {
      data.type = 'PONG';
      try {
        socket.send(JSON.stringify(data), msg.remoteAddress, BEACON_PORT);
      } catch (e) {
        console.error(e.message, e.stack);
        stopBeacon(e.message);
      }
    } else {

    }
  }

  function sendMessage() {
    if(!socket) return;

    message.seq ++;
    message.time = Date.now();
    var msg = JSON.stringify(message);
    try {
      socket.send(msg, MULTICAST_ADDRESS, BEACON_PORT);
      console.log(msg, MULTICAST_ADDRESS, BEACON_PORT);
    } catch(e) {
      console.error(e.message, e.stack);
      return stopBeacon(e.message);
    }

    updateDeviceList();
    setTimeout(sendMessage, BEACON_INTERVAL);
  }

  function startBeacon() {
    console.log("start beacon");
    button.disabled = true;
    button.removeEventListener('click', startBeacon);

    try {
      socket = new UDPSocket({loopback: false, localPort: BEACON_PORT});
    } catch(e) {
      console.error(e.message, e.stack);
      socket = null;
      return stopBeacon(e.message);
    }

    socket.joinMulticastGroup(MULTICAST_ADDRESS);

    message = {
      type: 'PING',
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}),
      seq: 0
    };

    socket.opened.then(function() {
      socket.addEventListener('message', receiveMessage);
      setTimeout(sendMessage, 0);

      button.addEventListener('click', stopBeacon);
      button.disabled = false;
    });

    button.textContent = "Stop";
  }

  function stopBeacon(err) {
    console.log("stop beacon");
    button.disabled = true;
    button.removeEventListener('click', stopBeacon);

    if(socket) {
      socket.removeEventListener('message', receiveMessage);
      socket.close();
      socket = null;
    }

    devices = {};
    message = null;
    updateDeviceList();

    if(err) {
      errtxt.textContent = err;
    }

    button.textContent = "Start";
    button.addEventListener('click', startBeacon);
    button.disabled = false;
  }

  // We want to wait until the localisations library has loaded all the strings.
  // So we'll tell it to let us know once it's ready.
  navigator.mozL10n.once(function() {
    button.addEventListener('click', startBeacon);
    button.disabled = false;
  });

  // ---
/*
  function start() {

    try {
      var socket = new UDPSocket({loopback: false, localPort: BEACON_PORT});
    } catch (e) {
      message = e.message;
    }
    console.log("socket created");
    socket.joinMulticastGroup(MULTICAST_ADDRESS);
    console.log("socket joined multicast group");

    function update_list() {
      var now = Date.now();
      while(device_list.firstChild) {
        device_list.removeChild(device_list.firstChild);
      }

      for(var addr in devices) {
        var item = document.createElement('li');
        var dt = Math.floor((now - devices[addr]) * MS_TO_S);
        var str;
        if(dt > 10)  {
          str = '<del>' + addr + '</del>';
        } else {
          str = addr;
        }

        item.innerHTML = str;
        device_list.appendChild(item);
      }
    }

    var beaconMessage = {
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);}),
      seq: 0
    };

    function recv_callback(msg) {
      var data = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(msg.data)));

      if(data.id == beaconMessage.id) return;

      devices[msg.remoteAddress] = Date.now();
      update_list();
      if(BEACON_PING == data) {
        console.log("recv PING from " + msg.remoteAddress);
        //socket.send(BEACON_PONG, msg.remoteAddress, msg.remotePort);
      } else {
        console.log("recv " + data + " from " + msg.remoteAddress);
      }
    }

    function ping() {
      beaconMessage.seq ++;
      var msg = JSON.stringify(beaconMessage);
      try {
        socket.send(msg, MULTICAST_ADDRESS, BEACON_PORT);
        console.log(msg, MULTICAST_ADDRESS, BEACON_PORT);
      } catch (e) {
        message = e.message;
      }
      update_list();
      setTimeout(ping, BEACON_INTERVAL);
    }

    socket.opened.then(function() {
      socket.addEventListener('message', recv_callback);
      setTimeout(ping, 0);
    });

  }
*/
});
