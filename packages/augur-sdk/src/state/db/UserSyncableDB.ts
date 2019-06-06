import { SyncableDB } from "./SyncableDB";
import { Augur } from "../../Augur";
import { ParsedLog } from "@augurproject/types";
import { DB } from "./DB";

/**
 * Stores event logs for user-specific events.
 */
export class UserSyncableDB extends SyncableDB {
  readonly user: string;
  private additionalTopics: Array<Array<string | string[]>>;

  constructor(dbController: DB, networkId: number, eventName: string, user: string, numAdditionalTopics: number, userTopicIndicies: number[], idFields: string[] = []) {
    super(dbController, networkId, eventName, dbController.getDatabaseName(eventName, user), idFields);
    this.user = user;
    const bytes32User = `0x000000000000000000000000${this.user.substr(2).toLowerCase()}`;
    this.additionalTopics = [];
    for (const userTopicIndex of userTopicIndicies) {
      const topics: Array<string | string[]> = [];
      topics.fill("", numAdditionalTopics);
      topics[userTopicIndex] = bytes32User;
      this.additionalTopics.push(topics);
    }
  }

  protected async getLogs(augur: Augur, startBlock: number, endBlock: number): Promise<ParsedLog[]> {
    let logs: ParsedLog[] = [];
    for (const topics of this.additionalTopics) {
      logs = logs.concat(await augur.events.getLogs(this.eventName, startBlock, endBlock, topics));
    }
    return logs;
  }
}
