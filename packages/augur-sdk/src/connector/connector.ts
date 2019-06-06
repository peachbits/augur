import { ContractEvents } from "@augurproject/types";
import { SubscriptionEventNames } from "../constants";

export type Callback = (data: any) => void;

export abstract class Connector {
  protected subscriptions: { [event: string]: { id: string, callback: Callback } } = {};

  // Lifecyle of the connector
  abstract async connect(params?: any): Promise<any>;
  abstract async disconnect(): Promise<any>;

  // bind API calls
  abstract bindTo<R, P>(f: (db: any, augur: any, params: P) => R): (params: P) => Promise<R>;

  abstract on(eventName: SubscriptionEventNames | string, callback: Callback): void;
  abstract off(eventName: SubscriptionEventNames | string): void;
}
