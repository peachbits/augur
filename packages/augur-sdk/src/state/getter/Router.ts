import { Augur } from "../../Augur";
import { DB } from "../db/DB";
import { PathReporter } from "io-ts/lib/PathReporter";
import { AddressFormatReviver } from "../../state/AddressFormatReviver";

import * as t from "io-ts";

export function Getter(alternateInterface?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): void => {
    if (!target || !target.name) {
      throw new Error(`Getter function on ${target.constructor.name} must be declared public static`);
    }

    if (alternateInterface) {
      if (!Object(target)[alternateInterface]) {
        throw new Error(`No params object for ${target.name} getter`);
      }

      Router.Add(propertyKey, descriptor.value, Object(target)[alternateInterface]);
    } else {
      if (!Object(target)[target.name + "Params"]) {
        throw new Error(`No params object for ${target.name}Params getter`);
      }

      Router.Add(propertyKey, descriptor.value, Object(target)[target.name + "Params"]);
    }

    Object.defineProperty(Object(target)[propertyKey], 'name', { value: propertyKey, writable: false });
  };
}

type GetterFunction<T, TBigNumber> = (db: DB, params: T) => Promise<unknown>;

export class Router {
  public static Add<T, R, TBigNumber>(name: string, getterFunction: GetterFunction<T, TBigNumber>, decodedParams: t.Validation<T>) {
    Router.routings.set(name, { func: getterFunction, params: decodedParams });
  }

  private static routings = new Map();

  private readonly augur: Augur;
  private readonly db: Promise<DB>;

  constructor(augur: Augur, db: Promise<DB>) {
    this.augur = augur;
    this.db = db;
  }

  public async route(name: string, params: any): Promise<any> {
    const getter = Router.routings.get(name);

    if (!getter) {
      throw new Error(`Invalid request ${name}`);
    }

    if (!getter.params) {
      throw new Error("no params type for getter ${name}");
    }

    const decodedParams = getter.params.decode(params);

    if (!decodedParams.isRight()) {
      throw new Error(`Invalid request object: ${PathReporter.report(decodedParams)}`);
    }

    for (const key in decodedParams.value) {
      decodedParams.value[key] = AddressFormatReviver(key, decodedParams.value[key]);
    }

    const db = await this.db;
    return getter.func(this.augur, db, decodedParams.value);
  }
}
