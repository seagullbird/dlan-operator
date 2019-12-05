const Web3 = require('web3')
const tokenInterface = require('../dlan-network/build/contracts/DlanCore.json')
const chainWsAddr = "ws://localhost:7545"
const dlanCoreAddr = "0xaE7F1947640FF06F49f72b78fCFfBeBAB764A278"


let web3Provider = new Web3.providers.WebsocketProvider(chainWsAddr)
var web3Obj = new Web3(web3Provider)
let dlancore = new web3Obj.eth.Contract(tokenInterface.abi, dlanCoreAddr)


dlancore.events.Deposited({}, function (error, event) {
    console.log("Deposited event received")
    console.log(event.returnValues)
})

dlancore.events.Exiting({}, function (error, event) {
    console.log("Deposited event received")
    console.log(event.returnValues)
})

dlancore.events.MerkleUpdated({}, function (error, event) {
    console.log("Deposited event received")
    console.log(event.returnValues)
})
