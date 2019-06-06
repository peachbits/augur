import { Connector, Callback } from "./connector";
import { SubscriptionEventNames } from "../constants";

export class EmptyConnector extends Connector {
  async connect(params?: any): Promise<any> {
    return;
  }

  async disconnect(): Promise<any> {
    return;
  }

  bindTo<R, P>(f: (db: any, augur: any, params: P) => R): (params: P) => Promise<R> {
    return async (params: P): Promise<R> => {
      return "" as any;
    };
  }

  on(eventName: SubscriptionEventNames, callback: Callback): void {
  }

  off(eventName: SubscriptionEventNames): void {
  }
}
