import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { AppState } from "store";
import { selectMarket } from "modules/markets/selectors/market";
import { MarketPositionsTable } from "modules/portfolio/components/common/market-positions-table";
import { updateModal } from "modules/modal/actions/update-modal";
import { MODAL_SELL_COMPLETE_SETS } from "modules/common/constants";

const mapStateToProps = (state: AppState, ownProps: any) => {
  const market = ownProps.market || selectMarket(ownProps.marketId);
  const positions = market.userPositions || [];

  return {
    positions,
    numCompleteSets:
      (market.myPositionsSummary &&
        market.myPositionsSummary.numCompleteSets) ||
      undefined,
    transactionsStatus: state.transactionsStatus
  };
};

const mapDispatchToProps = (dispatch: ThunkDispatch<void, any, Action>) => ({
  sellCompleteSets: (marketId: string, numCompleteSets: any, cb: Function) =>
    dispatch(
      updateModal({
        type: MODAL_SELL_COMPLETE_SETS,
        marketId,
        numCompleteSets,
        cb
      })
    )
});

const PositionsTable = withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MarketPositionsTable)
);

export default PositionsTable;
