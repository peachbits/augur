import { Connector, Callback } from "./connector/connector";
import { ContractAddresses, NetworkId } from "@augurproject/artifacts";
import { ContractInterfaces } from "@augurproject/core";
import { Contracts } from "./api/Contracts";
import { EmptyConnector } from "./connector/empty-connector";
import { Events } from "./api/Events";
import { Provider } from "./ethereum/Provider";
import { SubscriptionEventNames, isSubscriptionEventName } from "./constants";
import { Trade } from "./api/Trade";
import { TransactionStatusCallback, ContractDependenciesEthers } from "contract-dependencies-ethers";

export interface CustomEvent {
  name: string;
  eventName?: string;
  idFields?: string[];
}

export interface UserSpecificEvent extends CustomEvent {
  numAdditionalTopics: number;
  userTopicIndicies: number[];
}

export class Augur<TProvider extends Provider = Provider> {
  readonly provider: TProvider;
  private readonly dependencies: ContractDependenciesEthers;

  readonly networkId: NetworkId;
  readonly events: Events;
  readonly addresses: ContractAddresses;
  readonly contracts: Contracts;
  readonly trade: Trade;
  readonly connector: Connector;

  // TODO Set genericEventNames & userSpecificEvents using
  // GenericContractInterfaces instead of hardcoding them
  readonly genericEventNames: string[] = [
    "CompleteSetsPurchased",
    "CompleteSetsSold",
    "DisputeCrowdsourcerCompleted",
    "DisputeCrowdsourcerContribution",
    "DisputeCrowdsourcerCreated",
    "DisputeCrowdsourcerRedeemed",
    "DisputeWindowCreated",
    "InitialReporterRedeemed",
    "InitialReportSubmitted",
    "InitialReporterTransferred",
    "MarketCreated",
    "MarketFinalized",
    "MarketMigrated",
    "MarketParticipantsDisavowed",
    "MarketTransferred",
    "MarketVolumeChanged",
    "OrderEvent",
    "ParticipationTokensRedeemed",
    "ReportingParticipantDisavowed",
    "TimestampSet",
    "TradingProceedsClaimed",
    "UniverseCreated",
    "UniverseForked",
  ];

  readonly customEvents: CustomEvent[] = [
    {
      "name": "CurrentOrders",
      "eventName": "OrderEvent",
      "idFields": ["orderId"],
    },
  ];

  // TODO Update numAdditionalTopics/userTopicIndexes once contract events are updated
  readonly userSpecificEvents: UserSpecificEvent[] = [
    {
      "name": "TokensTransferred",
      "numAdditionalTopics": 3,
      "userTopicIndicies": [1, 2],
    },
    {
      "name": "ProfitLossChanged",
      "numAdditionalTopics": 3,
      "userTopicIndicies": [2],
    },
    {
      "name": "TokenBalanceChanged",
      "numAdditionalTopics": 2,
      "userTopicIndicies": [1],
      "idFields": ["token"],
    },
  ];

  constructor(provider: TProvider, dependencies: ContractDependenciesEthers, networkId: NetworkId, addresses: ContractAddresses, connector: Connector = new EmptyConnector()) {
    this.provider = provider;
    this.dependencies = dependencies;
    this.networkId = networkId;
    this.connector = connector;

    // API
    this.addresses = addresses;
    this.contracts = new Contracts(this.addresses, this.dependencies);
    this.trade = new Trade(this);
    this.events = new Events(this.provider, this.addresses.Augur);
  }

  static async create<TProvider extends Provider = Provider>(provider: TProvider, dependencies: ContractDependenciesEthers, addresses: ContractAddresses, connector: Connector = new EmptyConnector()): Promise<Augur> {
    const networkId = await provider.getNetworkId();
    const augur = new Augur<TProvider>(provider, dependencies, networkId, addresses, connector);

    await augur.contracts.setReputationToken(networkId);

    return augur;
  }

  async getAccount(): Promise<string> {
    return this.dependencies.getDefaultAddress();
  }

  getMarket(address: string): ContractInterfaces.Market {
    return new ContractInterfaces.Market(this.dependencies, address);
  }

  getOrders(): ContractInterfaces.Orders {
    return new ContractInterfaces.Orders(this.dependencies, this.addresses.Orders);
  }

  registerTransactionStatusCallback(key: string, callback: TransactionStatusCallback): void {
    this.dependencies.registerTransactionStatusCallback(key, callback);
  }

  deRegisterTransactionStatusCallback(key: string): void {
    this.dependencies.deRegisterTransactionStatusCallback(key);
  }

  deRegisterAllTransactionStatusCallbacks(): void {
    this.dependencies.deRegisterAllTransactionStatusCallbacks();
  }

  async connect(params?: any): Promise<any> {
    return this.connector.connect(params);
  }

  async disconnect(): Promise<any> {
    return this.connector.disconnect();
  }

  bindTo<R, P>(f: (db: any, augur: any, params: P) => R): (params: P) => Promise<R> {
    return this.connector.bindTo(f);
  }

  on(eventName: SubscriptionEventNames | string, callback: Callback): void {
    if (isSubscriptionEventName(eventName)) {
      this.connector.on(eventName, callback);
    }
  }

  off(eventName: SubscriptionEventNames | string): void {
    if (isSubscriptionEventName(eventName)) {
      this.connector.off(eventName);
    }
  }
}
