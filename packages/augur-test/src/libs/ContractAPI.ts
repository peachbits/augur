import { Account, ContractAPI } from "@augurproject/sdk/build/api/ContractAPI";
import { Augur } from "@augurproject/sdk";
import { EthersFastSubmitWallet } from "@augurproject/core";
import { ContractDependenciesEthers } from "contract-dependencies-ethers";
import { ContractAddresses } from "@augurproject/artifacts";
import { EthersProvider } from "@augurproject/ethersjs-provider";

export class TestingContractAPI extends ContractAPI {
  public static async userWrapper(account: Account, provider: EthersProvider, addresses: ContractAddresses) {
    const signer = await EthersFastSubmitWallet.create(account.secretKey, provider);
    const dependencies = new ContractDependenciesEthers(provider, signer, account.publicKey);
    const augur = await Augur.create(provider, dependencies, addresses);

    console.log("MARINA", "libs/")

    return new TestingContractAPI(augur, provider, account.publicKey);
  }

  public async faucet(attoCash: BigNumber): Promise<void> {
    await this.augur.contracts.cash.faucet(attoCash);
  }
}
