const Web3 = require('web3')
const Sqlite3 = require('sqlite3').verbose();
const Express = require('express')
const Morgan = require('morgan')
const request = require('request')
const tokenInterface = require('../dlan-network/build/contracts/DlanCore.json')
const chainWsAddr = "ws://localhost:7545"
const dlanCoreAddr = "0xaE7F1947640FF06F49f72b78fCFfBeBAB764A278"
const providerAddr = '0x962A7D4d95d148a2C5A9F5CBFd399d5bddf600ab'
const providerPrivate = '0xaee5c2b469764af52a78e47f9172b1c7170d4632448a4f23fa482b5b60eccd31'
const sha3_256 = require('js-sha3').sha3_256;
const { MerkleTree } = require('merkletreejs')

let web3Provider = new Web3.providers.WebsocketProvider(chainWsAddr)
var web3Obj = new Web3(web3Provider)
let dlancore = new web3Obj.eth.Contract(tokenInterface.abi, dlanCoreAddr)

dlancore.methods.provider_register().send({
  from: providerAddr,
  gas: 20000000
}, function (err, txHash) {
  if (err) {
    console.log(err)
  }
})

let db = new Sqlite3.Database('./database/users.db', (err) => {
  if (err) {
    console.error(err.message);
  } else console.log('Connected to database.');
})


var app = Express()
app.use(Morgan('combined'))
const port = 6000;
app.listen(port, () => {
  console.log("Server running on port " + port);
})

app.post("/merkleready", (req, res) => {
  var operator_root = req.query.merkleroot
  let sql = 'SELECT * FROM users2';
  var vendor_payments = {};
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
      if (row.nasname in vendor_payments) {
        vendor_payments[row.nasname].push({ key: row.address, value: row.payment });
      } else {
        vendor_payments[row.nasname] = []
        vendor_payments[row.nasname].push({ key: row.address, value: row.payment });
      }
    });
    var leaves_objects = []
    for (var key in vendor_payments) {
      leaves_objects.push(String(vendor_payments[key]));
    }
    const leaves = leaves_objects.map(x => sha3_256(x));
    const tree = new MerkleTree(leaves, sha3_256);
    var merkle_root = tree.getRoot().toString('hex')
    if (merkle_root == operator_root) {
      res.send('MATCHES!')

      const hashed_root = web3Obj.utils.sha3(merkle_root);
      const signed_root = web3Obj.eth.accounts.sign(hashed_root, providerPrivate);
      console.log(signed_root.signature)
      request.post('http://localhost:5000/signature?merkleroot=' + hashed_root + '&signature=' + signed_root.signature)
    }
    else res.send('DOES NOT MATCH')
  })
})
