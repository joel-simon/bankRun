// Load the twilio module
var twilio = require('twilio');

// Create a new REST API client to make authenticated requests against the
// twilio back end
// var client = new twilio.RestClient('ACde00f504fdc886ad16df897d5cd75d56', '3b4ea3ac6ecc488125a059d36e01740d');
var client = new twilio.RestClient('ACbc5a3cc8906f52d4b03da028a0593da2','f93069a9a405f0d4c7eb0dba6d8e3e42');




var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3();
var dynamodb = new AWS.DynamoDB();

var fs = require('fs');

function t(){
  return Math.floor(new Date().getTime()/1000);
}

// dynamodb.deleteTable({'TableName': 'stock'}, function (err, data) { //, 'IndexName': {'N':'1'}
//       if (err) {return (console.log('ERRQuery:', err)); } 
//       console.log('Successfully deleted');
//     });

var Game = (function () {
  var self;
  function Game() {
    self = this;
    self.stock = 'simon&simon';
    self.price = 100;
    self.value = 100;
    self.interval = 30; // seconds
    self.numbers = ['3475346100'];
    self.players = 12;
    self.share = Math.floor(self.value/self.players);
    self.init();
  }
  Game.prototype.init = function() {
    dynamodb.scan({'TableName': 'stock'}, function (err, data) { //, 'IndexName': {'N':'1'}
      if (err) {return (console.log('ERRQuery:', err)); } 
      if (true) {
        // self.announce();
        var item = {
          'time': {'N': ''+t()},
          'price': {'N': ''+self.price},
          'players': {'N': ''+self.players}
        }
        dynamodb.putItem({'TableName': 'stock', 'Item': item}, function (err, data) {
        if (err) {
          console.log('ERR Putting:', err); // an error occurred
        } else {
          console.log('STOCK CHANGED TO:', self.price); // successful response
        }
      });
        self.loop = setInterval(function(){self.onInterval()}, self.interval*1000);
      } else {

      }
    });
  }

  Game.prototype.onInterval = function() {
    dynamodb.scan({'TableName': 'stock'}, function (err, data) { //, 'IndexName': {'N':'1'}
      if (err) {return (console.log('ERRQuery:', err)); } 
      if (data.Count == 0) {
        self.updateStock();
        self.announce();
      } else {
        var maxT = 0;
        var maxP = 0;
        for (var i = 0; i < data.Items.length; i++) {
          if (+data.Items[i].time.N > maxT) {
            maxT = +data.Items[i].time.N;
            maxP = +data.Items[i].price.N;
          }
        }
        self.price = maxP;
        console.log('GOT OLD PRICE:', self.price);
        self.updateStock();
        self.announce();
      } 
    });
  };
  Game.prototype.updateStock = function() {
    if (self.price < self.value-50) {
      self.price = Math.floor(self.price * (1+((Math.random()-.2)/2)));
    } else if (self.price > self.value+50) {
      self.price = Math.floor(self.price * (1+((Math.random()-.5)/2)));
    } else {
      self.price = Math.floor(self.price * (1+((Math.random()-.4)/2)));
    }
    var item = {
      'time': {'N': ''+t()},
      'price': {'N': ''+self.price},
      'players': {'N': ''+self.players}
    }
    dynamodb.putItem({'TableName': 'stock', 'Item': item}, function (err, data) {
      if (err) {
        console.log('ERR Putting:', err); // an error occurred
      } else {
        console.log('STOCK CHANGED TO:', self.price, ', Value: '+self.value); // successful response
      }
    });
  };
  Game.prototype.announce = function(){
    for (var i = 0; i < self.numbers.length; i++) {
      sendMsg({'To': self.numbers[i], 'Msg': 'STOCK UPDATE:'+self.price });
    };
  }

  Game.prototype.sell = function(){
    self.value -= self.share;

    fs.appendFile('./log.txt', '{'+self.players+','+self.price+'}', function (err) {
      if (err) return console.log(err);
      console.log('The "data to append" was appended to file!');
    });

    self.players -= 1;
    if (self.players>0) {
       sendMsg({'To': self.numbers[0],'Msg':'A PLAYER HAS SOLD STOCK!!, its value has decreased. There are now '+self.players+ ' people left.'});
      // for (var i = 0; i < self.numbers.length; i++) {
      //   sendMsg({'To': self.numbers[i],
      //     'Msg': 'A PLAYER HAS SOLD STOCK!!, its value has decreased. There are now '+self.players+ ' people left.'});
      // }
    } else {
      for (var i = 0; i < self.numbers.length; i++) {
        sendMsg({'To': self.numbers[i], 'Msg': 'ALL PLAYERS HAVE SOLD STOCK! game is now over.'});
        clearInterval(self.loop);
      }
    }
  }
  return Game;
})();

// var joelGame = new Game();
// var requirejs = require('requirejs');
// requirejs.config({nodeRequire: require});
// requirejs(['../public/scripts/libs/Noduino', '../public/scripts/libs/Noduino.Serial', '../public/scripts/libs/Logger'], function (NoduinoObj, NoduinoConnector, Logger) {
//   var Noduino = new NoduinoObj({'debug': false}, NoduinoConnector, Logger);
//   Noduino.connect(function(err, board) {
//     if (err) { return console.log(err); }
//     console.log("found board");
//     // joelGame.init();

//     board.withLED({pin: 3}, function(err, LED) {
//       if (err) { return console.log(err); }
//       board.withButton({pin: 2}, function(err, Button) {
//         if (err) {console.log(err)};
//           Button.on('change', function(B) {
//             if (B.pushed) {
//               console.log("PUSHED");
//               LED.setOn();
//               console.log('here');
//                 setTimeout(function(){
//                   LED.setOff();
//                 }, 3000);
//                 joelGame.sell();
//             }
//           });
//         });
//     });
//   });
// });
for (var i = 0; i < 5; i++) {
  sendMsg({'To': '4403085582', 'Msg': 'ROARGHHHHH THE DINOSAUURRGHH'});
};


// Pass in parameters to the REST API using an object literal notation. The
// REST client will handle authentication and response serialzation for you.
function sendMsg(data){
  console.log('SENDING', data);
  // return;
  client.sms.messages.create({
    // to:'3475346100',
    // to:'3475346100',
    to: data.To,
    from: '3476256475',
    // from:'3476255694',
    body: data.Msg
    }, function(error, message) {
    // The HTTP request to Twilio will run asynchronously. This callback
    // function will be called when a response is received from Twilio
    // The "error" variable will contain error information, if any.
    // If the request was successful, this value will be "falsy"
    if (!error) {
      // The second argument to the callback will contain the information
      // sent back by Twilio for the request. In this case, it is the
      // information about the text messsage you just sent:
      console.log('Success! The SID for this SMS message is:', message.to, message.body);
      console.log(message.sid);
       
      console.log('Message sent on:');
      console.log(message.dateCreated);
    } else {
      console.log('Oops! There was an error.', error);
    }
  });
}
