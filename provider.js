const Web3 = require('web3')
const Sqlite3 = require('sqlite3').verbose();
const Express = require('express')
const Morgan = require('morgan')
const tokenInterface = require('../dlan-network/build/contracts/DlanCore.json')
const chainWsAddr = "ws://localhost:7545"
const dlanCoreAddr = "0xaE7F1947640FF06F49f72b78fCFfBeBAB764A278"
const opAddr = "0x010cBc9930C71f60cA18159A9B250F9Ed416129B"
const sha3_256 = require('js-sha3').sha3_256;
const { MerkleTree } = require('merkletreejs')

var broadcasted_root = 'd1d0f7737fc576f24252ccead8af9fc315e8cb16db6a926614e9d654a9a33a19'
let web3Provider = new Web3.providers.WebsocketProvider(chainWsAddr)
var web3Obj = new Web3(web3Provider)
let dlancore = new web3Obj.eth.Contract(tokenInterface.abi, dlanCoreAddr)

dlancore.methods.provider_register().send({
    from: opAddr,
    gas: 20000000
  }, function(err, txHash) {
    if (err) {
      console.log(err)
      return;
    }
})


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

function aggregateTransactions(db) {
    let sql = 'SELECT * FROM users2';
    var vendor_payments = {};
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
        if (row.nasname in vendor_payments){
          vendor_payments[row.nasname].push({key:row.address, value:row.payment});
        }else{
          vendor_payments[row.nasname] = []
          vendor_payments[row.nasname].push({key:row.address, value:row.payment});
        }
      });
      var leaves_objects = []
      for (var key in vendor_payments) {
        leaves_objects.push(String(vendor_payments[key]));
      }
      const leaves = leaves_objects.map(x => sha3_256(x));
      const tree = new MerkleTree(leaves, sha3_256);
      const root = tree.getRoot().toString('hex')
      return root;
    });
  }
  
  merkle_root = aggregateTransactions(db);

  if (merkle_root == broadcasted_root){

  }