import { Connector, Callback } from "./connector";
import { SubscriptionEventNames } from "../constants";
import fetch from "cross-fetch";

export class HTTPConnector extends Connector {

  constructor(readonly endpoint: string) {
    super();
  }

  async connect(params?: any): Promise<any> {
    return Promise.resolve();
  }

  async disconnect(): Promise<any> {
    return Promise.resolve();
  }

  bindTo<R, P>(f: (db: any, augur: any, params: P) => R) {
    return async (params: P): Promise<R> => {
      return (await (await fetch(this.endpoint, {
        method: "POST",
        body: JSON.stringify({ id: 42, method: f.name, params, jsonrpc: "2.0" }),
        headers: { "Content-Type": "application/json" },
      })).json()) as R;
    };
  }

  on(eventName: SubscriptionEventNames | string, callback: Callback): void { }
  off(eventName: SubscriptionEventNames | string): void { }
}
