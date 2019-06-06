import * as _ from "lodash";

export class ConnectOptions {
  static createFromEnvironment(): ConnectOptions {
    const options = new ConnectOptions();
    options.readFromEnvironment();
    return options;
  }

  http = "http://localhost:8545";
  ws = "ws://localhost:8546";
  ipc?: string;
  propagationDelayWaitMillis?: number;
  // maxRetries is the maximum number of retries for retryable Ethereum
  // RPC requests. maxRetries is passed to augur.js's augur.connect() and
  // then to ethrpc library.connect(), and is used internally by ethrpc
  // for both HTTP and WS transports. When an ethrpc request errors, a
  // subset of errors are statically configured as retryable, in which case
  // ethrpc will opaquely re-insert the RPC request at its internal queue
  // head, such that augur.js (and augur-node) are ignorant of requests
  // that eventually succeed after N retries (where N < maxRetries).
  maxRetries = 3;

  blocksPerChunk?: number;
  private readFromEnvironment() {
    const env = process.env;
    if (_.isFinite(env.MAX_REQUEST_RETRIES)) this.maxRetries = parseInt(env.MAX_REQUEST_RETRIES!, 10);
    if (_.isFinite(env.DELAY_WAIT_MILLIS)) this.propagationDelayWaitMillis = parseInt(env.DELAY_WAIT_MILLIS!, 10);

    if (env.ETHEREUM_HTTP || env.ETHEREUM_WS || env.ETHEREUM_IPC) {
      this.http = env.ETHEREUM_HTTP as string;
      this.ws = env.ETHEREUM_WS as string;
      this.ipc = env.ETHEREUM_IPC;
    }
  }
}
