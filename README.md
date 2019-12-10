# DLAN Operator

The decentralized network sharing solution.

## How to run

1. Install dependencies: `npm install`
2. Start Ganache blockchain (refer to README in dlan-network)
3. `node provider.js`
4. `node main.js`
5. (Optional) `node events-listener.js`. This script subscribes to all events emitted by the DlanCore contract, so that you get a clear view of which events were emitted. It doesn't affect the main functionalities.

It is recommended you run all of these on the same machine as the AAA service.

This instruction assumes that the AAA service and its database has already been set up with the configuration:

```javascript
let dbPool = Mariadb.createPool({
  database: "radius",
  host: "localhost",
  user: "dlan",
  password: "password"
})
```