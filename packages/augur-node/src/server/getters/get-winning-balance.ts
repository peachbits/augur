import * as t from "io-ts";
import Knex from "knex";
import * as _ from "lodash";

import { Address, BigNumber, PayoutRow, ReportingState } from "../../types";
import { BigNumber as BigNumberJS } from "bignumber.js";

import { getMarketsWithReportingState, groupByAndSum } from "./database";
import { roundToPrecision } from "../../utils/round-to-precision";

export const WinningBalanceParams = t.type({
  marketIds: t.array(t.string),
  account: t.string,
});

interface WinningPayoutRows extends PayoutRow<BigNumber> {
  marketId: Address;
  reportingState: ReportingState;
  balance: BigNumber;
  outcome: number;
}

export interface MarketWinnings {
  marketId: Address;
  winnings: BigNumber;
}

export async function getWinningBalance(db: Knex, augur: {}, params: t.TypeOf<typeof WinningBalanceParams>): Promise<Array<MarketWinnings>> {
  const marketsQuery: Knex.QueryBuilder = getMarketsWithReportingState(db, ["markets.marketId", "balances.balance", "balances.owner", "shareTokens.outcome", "payouts.*"]);
  marketsQuery.whereIn("markets.marketId", params.marketIds);
  marketsQuery.whereIn("reportingState", [ReportingState.FINALIZED, ReportingState.AWAITING_FINALIZATION]);
  marketsQuery.join("tokens AS shareTokens", function () {
    this
      .on("shareTokens.marketId", "markets.marketId")
      .andOn("symbol", db.raw("?", "shares"));
  });
  marketsQuery.join("balances", function () {
    this
      .on("balances.token", "shareTokens.contractAddress")
      .andOn("balances.owner", db.raw("?", params.account));
  });
  marketsQuery.join("payouts", function () {
    this
      .on("payouts.marketId", "markets.marketId")
      .andOn("payouts.winning", db.raw("1"));
  });
  const winningPayoutRows: Array<WinningPayoutRows> = await marketsQuery;
  const calculatedWinnings = _.map(winningPayoutRows, (winningPayoutRow) => {
    const payoutKey = `payout${winningPayoutRow.outcome}` as keyof PayoutRow<BigNumber>;
    const payout = winningPayoutRow[payoutKey] as BigNumber;
    const winnings: BigNumber = payout.multipliedBy(winningPayoutRow.balance);

    return { marketId: winningPayoutRow.marketId, winnings: new BigNumber(roundToPrecision(winnings, 0, "", BigNumberJS.ROUND_DOWN)) };
  });
  return groupByAndSum(calculatedWinnings, ["marketId"], ["winnings"]);
}
