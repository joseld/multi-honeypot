
// To create Multi listeners in diferents HTTP Ports
var http=require('http');

// To create request petitions to logit...
var request = require('request');

// To read files from file system
var fs = require('fs');

var IPSTACK_ACCESS_KEY  = 'XXX';
var LOGIT_API_KEY       = 'XXX';

var ports = [88, 8080, 8081, 8082, 8083, 49153];
var servers = [];
var s;

function handle_BOA_Webcam(req, res) {
    // PORT 8080
    res.setHeader('Content-Type','text/html');
    res.setHeader('Server', 'Boa/0.94.14rc21');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Date', 'Thu, 12 Jul 2018 23:03:46 GMT');
    res.setHeader('Connection', 'Keep-Alive');
    res.setHeader('Keep-Alive', 'timeout=10, max=1000');
    res.setHeader('Content-Length', '14221');
    res.setHeader('Last-Modified', 'Thu, 12 Jul 2018 23:03:46 GMT');
    
    var content = fs.readFileSync('boa.html', 'utf8');
    res.statusCode = 200;
    res.end(content);
}

function handle_tplink_WR841N(req, res) {
    // PORT 88
    res.setHeader('Content-Type','text/html');
    res.setHeader('WWW-Authenticate', 'Basic realm="TP-LINK Wireless N Router WR841N"');
    res.setHeader('Server', 'Router Webserver');
    var content = fs.readFileSync('tplink.html', 'utf8');
    res.statusCode = 200;
    res.end(content);
    res.end();
}

function handle_WeMo_Link_Plug(req, res) {
    // PORT 49153
    res.setHeader('Content-Type','text/xml');
    res.setHeader('LAST-MODIFIED', 'Sat, 01 Jan 2000 00:01:30 GMT');
    res.setHeader('Server', 'Unspecified, UPnP/1.0, Unspecified');
    res.setHeader('X-User-Agent', 'redsonic');
    res.statusCode = 200;
    var content = fs.readFileSync('wemo.xml', 'utf8');
    res.end(content);
}


function handle_Alegro_Web_Server(req, res) {
    // PORT 8090
    res.setHeader('Content-Type','text/html');
    res.setHeader('Transfer-Encoding','chunked');
    res.setHeader('Server', 'Allegro-Software-RomPager/5.40b1');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 200;
    res.end();
}

function handle_router_SDT_CS3B1(req, res) {
    // PORT 8081, 8082, 8083
    res.setHeader('Content-Type','text/html');
    res.setHeader('ETag','1038239157');
    res.setHeader('Last-Modified','Fri, 01 Apr 2016 13:05:48 GMT');
    res.setHeader('Content-Length','5703');
    res.setHeader('Date','Fri, 13 Jul 2018 15:54:54 GMT');
    res.setHeader('Server', 'lighttpd/1.4.20');

    var content = fs.readFileSync('sdt-cs3b1.html', 'utf8');
    res.end(content);
}

function getIPv4(ip){

    if (ip.length < 15) 
    {   
        ip = ip;
    }
    else
    {
        var nyIP = ip.slice(7);
        ip = nyIP;
    }
    return ip;
}

function req2logmessage (req, callback, label){
    var now     = new Date();

    var data = new Object();
    data.date = now;
    data.remoteAddress = req.socket.remoteAddress;
    data.ipv4 = getIPv4(req.socket.remoteAddress);
    
    data.method = req.method;
    data.url = req.url;
    data.port = req.socket.localPort;
    data.headers = req.headers;
    data.label = label;
    geoIP(data.ipv4, data, callback);
}

function geoIP (ip, data, callback){
    var options = {
          url: 'http://api.ipstack.com/'+ip+'?access_key='+IPSTACK_ACCESS_KEY,
          method: 'GET',
      };

      request(options,function (error, response, body) {  
            //Print the Response
            if (error != null){
                console.log("Respuesta GeoIP Error:"+error);
                console.log("Respuesta GeoIP response:"+JSON.stringify(response));
            } else {
                geoipJSON = JSON.parse(body);
                data.geoIP = geoipJSON;
                data.pais = geoipJSON.country_name;
            }
            callback(data);
        } 
        );
}

function sendLog2Logit (data){
console.log("JSON:"+JSON.stringify(data));
 var options = {
      url: 'https://api.logit.io/v2',
      method: 'POST',
      //json: true,
      body: JSON.stringify(data),
      headers: {
          'Content-Type': 'application/json',
          'ApiKey': LOGIT_API_KEY,
          'LogType': 'SampleHttpLog'   
      }
  };

  request(options,function (error, response, body) {  
        //Print the Response
        if (error != null){
            console.log("Respuesta logit Error:"+error);
            console.log("Respuesta logit response:"+JSON.stringify(response));
            console.log("Respuesta logit:"+JSON.stringify(body)); 
        }
    } 
    );
}


function log(m){
    console.log("\nLog:"+JSON.stringify(m));
    sendLog2Logit(m);
}

function reqHandler(req, res) {
 
    switch(String(req.socket.localPort)) {

        case "88":
            req2logmessage(req, log, "tplink");
            handle_tplink_WR841N(req, res);
            break;
	    case "8080":
            req2logmessage(req, log, "BOA Web Server Webcam");
	        handle_BOA_Webcam(req, res);
	        break;
        case "8081":
        case "8082":
        case "8083":
            req2logmessage(req, log, "Router SDT_CS3B1");
            handle_router_SDT_CS3B1(req, res);
            break;
	    case "49153":
            req2logmessage(req, log, "WeMo Link Plug");
	        handle_WeMo_Link_Plug(req, res);
	        break;
	}
}

ports.forEach(function(port) {
    console.log("Open on "+port);
    s = http.createServer(reqHandler);
    s.listen(port);
    servers.push(s);
});