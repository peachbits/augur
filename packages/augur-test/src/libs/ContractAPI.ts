import { Account, ContractAPI } from "@augurproject/sdk/src/api/ContractAPI";
import { Augur, PlaceTradeDisplayParams } from "@augurproject/sdk";
import { ContractInterfaces, EthersFastSubmitWallet } from "@augurproject/core";
import { ContractDependenciesEthers } from "contract-dependencies-ethers";
import { ContractAddresses } from "@augurproject/artifacts";
import { EthersProvider } from "@augurproject/ethersjs-provider";
import { BigNumber } from "bignumber.js";

export class TestContractAPI extends ContractAPI {
  public static async userWrapper(account: Account, provider: EthersProvider, addresses: ContractAddresses) {
    const signer = await EthersFastSubmitWallet.create(account.secretKey, provider);
    const dependencies = new ContractDependenciesEthers(provider, signer, account.publicKey);
    const augur = await Augur.create(provider, dependencies, addresses);

    return new TestContractAPI(augur, provider, account.publicKey);
  }

  public async faucet(attoCash: BigNumber): Promise<void> {
    await this.augur.contracts.cash.faucet(attoCash);
  }

  public async createYesNoMarket(
    universe: ContractInterfaces.Universe,
    endTime: BigNumber,
    feePerCashInAttoCash: BigNumber,
    affiliateFeeDivisor: BigNumber,
    designatedReporter: string,
    topic: string,
    extraInfo: string,
  ): Promise<ContractInterfaces.Market> {
    const marketCreationFee = await universe.getOrCacheMarketCreationCost_();
    await this.faucet(marketCreationFee);

    return super.createYesNoMarket(
      universe,
      endTime,
      feePerCashInAttoCash,
      affiliateFeeDivisor,
      designatedReporter,
      topic,
      extraInfo,
    );
  }

  public async createCategoricalMarket(
    universe: ContractInterfaces.Universe,
    endTime: BigNumber,
    feePerCashInAttoCash: BigNumber,
    affiliateFeeDivisor: BigNumber,
    designatedReporter: string,
    outcomes: Array<string>,
    topic: string,
    extraInfo: string
  ): Promise<ContractInterfaces.Market> {
    const marketCreationFee = await universe.getOrCacheMarketCreationCost_();
    await this.faucet(marketCreationFee);

    return super.createCategoricalMarket(
      universe,
      endTime,
      feePerCashInAttoCash,
      affiliateFeeDivisor,
      designatedReporter,
      outcomes,
      topic,
      extraInfo,
    );
  }

  public async createScalarMarket(
    universe: ContractInterfaces.Universe,
    endTime: BigNumber,
    feePerCashInAttoCash: BigNumber,
    affiliateFeeDivisor: BigNumber,
    designatedReporter: string,
    prices: Array<BigNumber>,
    numTicks: BigNumber,
    topic: string,
    extraInfo: string,
  ): Promise<ContractInterfaces.Market> {
    const marketCreationFee = await universe.getOrCacheMarketCreationCost_();
    await this.faucet(marketCreationFee);

    return super.createScalarMarket(
      universe,
      endTime,
      feePerCashInAttoCash,
      affiliateFeeDivisor,
      designatedReporter,
      prices,
      numTicks,
      topic,
      extraInfo,
    );
  }

  public async placeOrder(
    market: string,
    type: BigNumber,
    numShares: BigNumber,
    price: BigNumber,
    outcome: BigNumber,
    betterOrderID: string,
    worseOrderID: string,
    tradeGroupID: string,
  ): Promise<string> {
    const cost = numShares.multipliedBy(price);
    await this.faucet(cost);

    return super.placeOrder(
      market,
      type,
      numShares,
      price,
      outcome,
      betterOrderID,
      worseOrderID,
      tradeGroupID,
    );
  }

  public async fillOrder(orderId: string, cost: BigNumber, numShares: BigNumber, tradeGroupId: string) {
    await this.faucet(cost.multipliedBy(10000));
    return super.fillOrder(orderId, cost, numShares, tradeGroupId);
  }

  public async takeBestOrder(
    marketAddress: string,
    type: BigNumber,
    numShares: BigNumber,
    price: BigNumber,
    outcome: BigNumber,
    tradeGroupID: string,
  ): Promise<void> {
    const cost = numShares.multipliedBy(price);
    await this.faucet(cost);

    return super.takeBestOrder(marketAddress, type, numShares, price, outcome, tradeGroupID);
  }

  public async placeTrade(params: PlaceTradeDisplayParams): Promise<void> {
    const price = params.direction === 0 ? params.displayPrice : params.numTicks.minus(params.displayPrice);
    const cost = params.displayAmount.multipliedBy(price).multipliedBy(10 ** 18);
    await this.faucet(cost);

    return await super.placeTrade(params);
  }

  public async buyCompleteSets(market: ContractInterfaces.Market, amount: BigNumber): Promise<void> {
    const numTicks = await market.getNumTicks_();
    const cashValue = amount.multipliedBy(numTicks);
    await this.faucet(cashValue);

    return super.buyCompleteSets(market, amount);
  }
}
