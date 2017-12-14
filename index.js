var https = require('https');

function pushToLaMetric(result, endContext) {
  const host = "developer.lametric.com"
  const appPath = "/api/V1/dev/widget/update/com.lametric.<your app id>"
  const version = "/<your app version>"
  
  const stringifiedResult = JSON.stringify(result)
  
  const options = {
    hostname: host,
    path: appPath + version,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Access-Token': '<your access token>',
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(stringifiedResult)
    }
  };
  
  var post_req = https.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
          endContext();
      });
  });

  // post the data
  post_req.write(stringifiedResult);
  post_req.end();
}

const icons = {
  down: 'i124',
  up: 'i120'
}

exports.handler = (event, context, callback) => {
    console.log("STARTING")
    
    https.get("https://api.coinmarketcap.com/v1/ticker/aventus/", function(res) {
      console.log("Got response: " + res.statusCode);
        
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          
          const metrics = parsedData[0];
          const symbol  = metrics.symbol;
          const price   = Math.round(metrics.price_usd * 10) / 10;
          const change  = Math.round(metrics.percent_change_1h * 10) / 10;
          const icon    = change > 0 ? icons.up : icons.down;
          
          const result = {
            frames: [
                {
                    text: `${symbol}|$${price}`,
                    icon: icon
                },
                {
                    text: `${symbol}|${change}%`,
                    icon: icon
                }
            ]
          };
          
          console.log(result);
          
          pushToLaMetric(result, () => context.done(null, result));
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        context.done(e.message);
    });
};

