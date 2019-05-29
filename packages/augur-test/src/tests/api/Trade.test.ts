import {
  ACCOUNTS,
  deployContracts,
  TestContractAPI,
} from "../../libs";
import { BigNumber } from "bignumber.js";
import { Contracts as compilerOutput } from "@augurproject/artifacts";

let john: TestContractAPI;
let mary: TestContractAPI;

beforeAll(async () => {
  const {provider, addresses} = await deployContracts(ACCOUNTS, compilerOutput);

  john = await TestContractAPI.userWrapper(ACCOUNTS[0], provider, addresses);
  mary = await TestContractAPI.userWrapper(ACCOUNTS[1], provider, addresses);
  await john.approveCentralAuthority();
  await mary.approveCentralAuthority();
}, 120000);

test("Trade :: placeTrade", async () => {
  const market1 = await john.createReasonableYesNoMarket(john.augur.contracts.universe);

  await john.placeBasicYesNoTrade(0, market1, 1, new BigNumber(1), new BigNumber(0.4), new BigNumber(0));

  const orderId = await john.getBestOrderId(new BigNumber(0), market1.address, new BigNumber(1));

  let amountInOrder = await john.augur.contracts.orders.getAmount_(orderId);
  await expect(amountInOrder.toNumber()).toEqual(10**16);

  await mary.placeBasicYesNoTrade(1, market1, 1, new BigNumber(0.5), new BigNumber(0.4), new BigNumber(0));

  amountInOrder = await john.augur.contracts.orders.getAmount_(orderId);
  await expect(amountInOrder.toNumber()).toEqual(10**16 / 2);

}, 15000);
