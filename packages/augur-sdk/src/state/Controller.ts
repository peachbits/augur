import { Augur } from "../Augur";
import { PouchDBFactoryType } from "./db/AbstractDB";
import { DB } from "./db/DB";
import { BlockAndLogStreamerListener } from "./db/BlockAndLogStreamerListener";
const settings = require("./settings.json");

export class Controller {
  db: DB;

  constructor(
    private augur: Augur,
    private networkId: number,
    private blockstreamDelay: number,
    private defaultStartSyncBlockNumber: number,
    private trackedUsers: string[],
    private pouchDBFactory: PouchDBFactoryType,
    private blockAndLogStreamerListener: BlockAndLogStreamerListener
  ) {
  }

  fullTextSearch(eventName: string, query: string): object[] {
    return this.db.fullTextSearch(eventName, query);
  }

  async createDb() {
    this.db = await DB.createAndInitializeDB(
      this.networkId,
      this.blockstreamDelay,
      this.defaultStartSyncBlockNumber,
      this.trackedUsers,
      this.augur.genericEventNames,
      this.augur.customEvents,
      this.augur.userSpecificEvents,
      this.pouchDBFactory,
      this.blockAndLogStreamerListener
    );
  }

  async run(): Promise<void> {
    try {
      this.db = await DB.createAndInitializeDB(
        this.networkId,
        this.blockstreamDelay,
        this.defaultStartSyncBlockNumber,
        this.trackedUsers,
        this.augur.genericEventNames,
        this.augur.customEvents,
        this.augur.userSpecificEvents,
        this.pouchDBFactory,
        this.blockAndLogStreamerListener
      );
      await this.db.sync(
        this.augur,
        settings.chunkSize,
        settings.blockstreamDelay
      );

      this.blockAndLogStreamerListener.listenForBlockRemoved(this.db.rollback.bind(this.db));
      this.blockAndLogStreamerListener.startBlockStreamListener();

      // TODO begin server process
    } catch (err) {
      console.log(err);
    }
  }
}
