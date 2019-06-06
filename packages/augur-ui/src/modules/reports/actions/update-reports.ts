export const MARKETS_REPORT = "MARKETS_REPORT";

export const addMarketsReport = (
  universeId: string,
  marketIds: string[]
) => ({
  type: MARKETS_REPORT,
  data: {
    universeId,
    marketIds,
  },
});
