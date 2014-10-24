// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {

  // We'll ask the browser to use strict code to help us catch errors earlier.
  // https://developer.mozilla.org/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
  'use strict';

  var translate = navigator.mozL10n.get;

  // We want to wait until the localisations library has loaded all the strings.
  // So we'll tell it to let us know once it's ready.
  navigator.mozL10n.once(start);

  // ---

  function start() {

    var message = document.getElementById('message');

    // We're using textContent because inserting content from external sources into your page using innerHTML can be dangerous.
    // https://developer.mozilla.org/Web/API/Element.innerHTML#Security_considerations
    // message.textContent = translate('message');

    var MS_TO_S = 1/1000;
    var BEACON_PING = 'PING';
    var BEACON_PONG = 'PONG';
    var BEACON_PORT = 9903;
    var BEACON_INTERVAL = 5000;
    var MULTICAST_ADDRESS = '224.0.0.255';
    var socket = new UDPSocket({loopback: false, localPort:BEACON_PORT});
    console.log("socket created");
    socket.joinMulticastGroup(MULTICAST_ADDRESS);
    console.log("socket joined multicast group");

    var devices = {};
    var device_list = document.getElementById('device-list');

    function update_list() {
      var now = Date.now();
      while(device_list.firstChild) {
        device_list.removeChild(device_list.firstChild);
      }

      for(var addr in devices) {
        var item = document.createElement('li');
        var dt = Math.floor((now - devices[addr]) * MS_TO_S);
        if(dt > 60) continue;
        var str = addr;
        if(dt > 10) {
          str += " (" + dt + ")";
        }
        item.textContent = str;
        device_list.appendChild(item);
      }
    }

    function recv_callback(msg) {
      devices[msg.remoteAddress] = Date.now();
      update_list();
      var data = String.fromCharCode.apply(null, new Uint8Array(msg.data));
      if(BEACON_PING == data) {
        console.log("recv PING from " + msg.remoteAddress + "; send PONG");
        socket.send(BEACON_PONG, msg.remoteAddress, msg.remotePort);
      } else {
        console.log("recv " + data + " from " + msg.remoteAddress);
      }
    }

    function ping() {
      socket.send(BEACON_PING, MULTICAST_ADDRESS, BEACON_PORT);
      update_list();
      setTimeout(ping, BEACON_INTERVAL);
    }

    socket.opened.then(function() {
      socket.addEventListener('message', recv_callback);
      setTimeout(ping, 0);
    });

/*
    var socket = new UDPSocket({loopback: true});

    var HELLO_WORLD = 'hlo wrld. ';
    var MCAST_ADDRESS = '224.0.0.255';
    socket.joinMulticastGroup(MCAST_ADDRESS);

    socket.opened.then(function() {
      socket.send(HELLO_WORLD, MCAST_ADDRESS, socket.localPort);

      socket.addEventListener('message', function recv_callback(msg) {
        console.log("message");
        socket.removeEventListener('message', recv_callback);
        socket.leaveMulticastGroup(MCAST_ADDRESS);
      });
    });
*/

  }

});
