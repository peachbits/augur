import Knex from "knex";
import helmet from "helmet";
import * as t from "io-ts";
import { Address, Augur, ServersData } from "../types";
import { runWebsocketServer } from "./run-websocket-server";
import { getMarkets, GetMarketsParams } from "./getters/get-markets";
import { isSyncFinished } from "../blockchain/bulk-sync-augur-node-with-blockchain";
import { EventEmitter } from "events";
import express from "express";
import { Addresses } from "@augurproject/artifacts";

import { websocketConfigs } from "../config.json";

export interface RunServerResult {
  app: express.Application;
  servers: ServersData;
}

enum ServerStatus {
  DOWN = "down",
  UP = "up",
  SYNCING = "syncing",
}

export function runServer(db: Knex, augur: Augur, controlEmitter: EventEmitter = new EventEmitter()): RunServerResult {
  const app: express.Application = express();

  app.use(helmet({
    hsts: false,
  }));

  const servers: ServersData = runWebsocketServer(db, app, augur, websocketConfigs, controlEmitter);

  app.get("/", (req, res) => {
    res.send("Augur Node Running, use /status endpoint");
  });

  app.get("/status", (req, res) => {
    try {
      if (!isSyncFinished()) {
        res.status(503).send({ status: ServerStatus.SYNCING, reason: "server syncing" });
        return;
      }

      const universe: Address = Addresses[augur.networkId].Universe;

      getMarkets(db, augur, {universe} as t.TypeOf<typeof GetMarketsParams>).then((result: any) => {
        if (result.length === 0) {
          res.status(503).send({ status: ServerStatus.DOWN, reason: "No markets found", universe });
        } else {
          res.send({ status: ServerStatus.UP, universe });
        }
      }).catch((e) => { throw e; });
    } catch (e) {
      res.status(503).send({ status: ServerStatus.DOWN, reason: e.message });
    }
  });

  app.get("/status/database", (req, res) => {
    if (!isSyncFinished()) {
      res.status(503).send({ status: ServerStatus.SYNCING, reason: "server syncing" });
      return;
    }

    const maxPendingTransactions: number = (typeof req.query.max_pending_transactions === "undefined") ? 1 : parseInt(req.query.max_pending_transactions, 10);
    if (isNaN(maxPendingTransactions)) {
      res.status(422).send({ error: "Bad value for max_pending_transactions, must be an integer in base 10" });
    } else {
      const waitingClientsCount = db.client.pool.pendingAcquires.length;
      const status = (maxPendingTransactions > waitingClientsCount) ? ServerStatus.UP : ServerStatus.DOWN;
      res.status(status === ServerStatus.UP ? 200 : 503).send({
        status,
        maxPendingTransactions,
        pendingTransactions: waitingClientsCount,
      });
    }
  });

  app.get("/status/blockage", (req, res) => {
    if (!isSyncFinished()) {
      res.status(503).send({ status: ServerStatus.SYNCING, reason: "server syncing" });
      return;
    }

    db("blocks").orderBy("blockNumber", "DESC").first().asCallback((err: Error, newestBlock: any) => {
      if (err) return res.status(503).send({ error: err.message });
      if (newestBlock == null) return res.status(503).send({ error: "No blocks available" });
      const timestampDelta: number = Math.round((Date.now() / 1000) - newestBlock.timestamp);
      const timestampDeltaThreshold = (typeof req.query.time === "undefined") ? 120 : parseInt(req.query.time, 10);
      if (isNaN(timestampDeltaThreshold)) {
        res.status(422).send({ error: "Bad value for time parameter, must be an integer in base 10" });
      }
      const status = timestampDelta > timestampDeltaThreshold ? ServerStatus.DOWN : ServerStatus.UP;
      return res.status(status === ServerStatus.UP ? 200 : 503).send(Object.assign({ status, timestampDelta }, newestBlock));
    });
  });

  app.get("/status/sync", (req, res) => {
    if (!isSyncFinished()) {
      res.status(503).send({ status: ServerStatus.DOWN, reason: "server syncing" });
    } else {
      res.send({ status: ServerStatus.UP, reason: "Finished with sync" });
    }
  });

  return { app, servers };
}

export function shutdownServers(servers: ServersData) {
  servers.httpServers.forEach((server, index) => {
    server.close(() => servers.servers[index].close());
  });
}
