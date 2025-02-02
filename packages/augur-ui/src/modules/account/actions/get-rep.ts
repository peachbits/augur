import { augur } from "services/augurjs";
import { updateAlert } from "modules/alerts/actions/alerts";
import { updateAssets } from "modules/auth/actions/update-assets";
import { selectCurrentTimestampInSeconds as getTime } from "store/select-state";
import {
  UNIVERSE_ID,
  CONFIRMED,
  FAILED,
} from "modules/common/constants";
import logError from "utils/log-error";
import noop from "utils/noop";
import { AppState } from "store";
import { Action } from "redux";
import { ThunkDispatch } from "redux-thunk";
import { NodeStyleCallback } from "modules/types";

export default function(callback: NodeStyleCallback = logError) {
  return (dispatch: ThunkDispatch<void, any, Action>, getState: () => AppState) => {
    const { universe, loginAccount } = getState();
    const universeID = universe.id || UNIVERSE_ID;
    const update = (id: string, status: string) =>
      dispatch(
        updateAlert(id, {
          id,
          status,
          timestamp: getTime(getState()),
        }),
      );
    augur.api.Universe.getReputationToken(
      { tx: { to: universeID } },
      (err: any, reputationTokenAddress: string) => {
        if (err) return callback(err);
        augur.api.TestNetReputationToken.faucet({
          tx: { to: reputationTokenAddress },
          _amount: 0,
          meta: loginAccount.meta,
          onSent: noop,
          onSuccess: (res: any) => {
            // Trigger the alert updates in the callback functions
            // because Augur Node does not emit an event for TokensMinted.
            update(res.hash, CONFIRMED);
            dispatch(updateAssets());
            callback(null);
          },
          onFailed: (res: any) => {
            update(res.hash, FAILED);
            logError(res);
          },
        });
      },
    );
  };
}
