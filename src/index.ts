import Augur from "augur.js";
import * as Knex from "knex";
import * as sqlite3 from "sqlite3";
import * as _ from "lodash";
import { EthereumNodeEndpoints } from "./types";
import { checkAugurDbSetup } from "./setup/check-augur-db-setup";
import { syncAugurNodeWithBlockchain } from "./blockchain/sync-augur-node-with-blockchain";
import { runServer } from "./server/run-server";

// tslint:disable-next-line:no-var-requires
const {augurDbPath, ethereumNodeEndpoints, uploadBlockNumbers } = require("../config");

let db: Knex;
if (process.env.DATABASE_URL) {
  // Be careful about non-serializable transactions. We expect database writes to be processed from the blockchain, serially, in block order.
  db = Knex({
    client: "pg",
    connection: process.env.DATABASE_URL,
  });
} else {
  sqlite3.verbose();
  db = Knex({
    client: "sqlite3",
    connection: {
      filename: augurDbPath,
    },
    acquireConnectionTimeout: 5 * 60 * 1000,
    useNullAsDefault: true,
  });
}

const envEndpoints: EthereumNodeEndpoints = _.omitBy({
  http: process.env.ENDPOINT_HTTP,
  ws: process.env.ENDPOINT_WS,
}, _.isNil);

const configuredEndpoints: EthereumNodeEndpoints = _.isEmpty(envEndpoints) ? ethereumNodeEndpoints : envEndpoints;

const augur: Augur = new Augur();

augur.rpc.setDebugOptions({ broadcast: false });
augur.events.nodes.ethereum.on("disconnect", () => {
  console.log(("Disconnected from eth node"));
  process.exit(1);
});

const { app, servers }  = runServer(db, augur);

checkAugurDbSetup(db, (err?: Error|null): void => {
  if (err) {
    console.error("checkAugurDbSetup:", err);
    servers.forEach((websocketServer) => websocketServer.close());
    process.exit(1);
  }
  syncAugurNodeWithBlockchain(db, augur, configuredEndpoints, uploadBlockNumbers, (err?: Error|null): void => {
    if (err) {
      console.error("syncAugurNodeWithBlockchain:", err);
      servers.forEach((websocketServer) => websocketServer.close());
      process.exit(1);
    }
    console.log("Sync with blockchain complete.");
  });
});
