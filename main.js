const Web3 = require('web3')
const Sqlite3 = require('sqlite3').verbose();
const Express = require('express')
const Morgan = require('morgan')
const tokenInterface = require('../dlan-network/build/contracts/DlanCore.json')
const chainWsAddr = "ws://localhost:7545"
const dlanCoreAddr = "0xaE7F1947640FF06F49f72b78fCFfBeBAB764A278"
const opAddr = "0x010cBc9930C71f60cA18159A9B250F9Ed416129B"


let web3Provider = new Web3.providers.WebsocketProvider(chainWsAddr)
var web3Obj = new Web3(web3Provider)
let dlancore = new web3Obj.eth.Contract(tokenInterface.abi, dlanCoreAddr)

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

let db = new Sqlite3.Database('./database/users.db', (err) => {
  if (err) {
    console.error(err.message);
  } else console.log('Connected to database.');
})

dlancore.events.Deposited({}, function(error, event) {
  console.log("Deposited event received")
  console.log(event.returnValues)
  db.each(`UPDATE users SET bal = bal + ? WHERE address = ?`,
    [event.returnValues.numberOfDlanTokens, event.returnValues.owner.toLowerCase()], (err, row) => {
      if (err) console.log(err)
    })
})

dlancore.events.Exiting({}, function(error, event) {
  console.log("Exiting event received")
  console.log(event.returnValues);
  var owner = event.returnValues.owner.toLowerCase()
  db.get(`SELECT bal, signature FROM users WHERE address = ?`, [owner], (err, row) => {
    if (err) {
      console.log(err)
      return
    }
    dlancore.methods.challenge(owner, row.bal, hexToBytes(row.signature)).send({
      from: opAddr,
      gas: 20000000
    }, function(err, txHash) {
      if (err) {
        console.log(err)
        return;
      }
      db.each(`UPDATE users SET bal = 0 WHERE address = ?`,
        [owner], (err, row) => {
          if (err) console.log(err)
        })
    })
  })
})

var app = Express()
app.use(Morgan('combined'))
const port = 5000;
app.listen(port, () => {
 console.log("Server running on port " + port);
})

app.get("/balance", (req, res) => {
  var addr = req.query.address
  if (!addr) res.send("need parameter 'address'")
  else {
    db.get(`SELECT bal FROM users WHERE address = ?`, [addr], (err, row) => {
      if (err) {
        console.log(err)
        res.send(`${err}`)
      }
      else res.send(`${row.bal}`)
    })
  }
})

app.post("/transaction", (req, res) => {
  var addr = req.query.address
  var bal = req.query.bal
  var sig = req.query.signature

  db.each(`UPDATE users SET bal = ?, signature = ?`, [bal, sig], (err, row) => {
    if (err) {
      console.log(err)
      res.send(`${err}`)
      return
    }
  })
  res.send("")
})
