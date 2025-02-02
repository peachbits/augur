import { augur } from "services/augurjs";
import { updateUniverse } from "modules/universe/actions/update-universe";
import logError from "utils/log-error";
import { AppState } from "store";
import { Action } from "redux";
import { ThunkDispatch } from "redux-thunk";

export const updatePlatformTimeframeData = (
  options: any = {},
  callback: any = logError,
) => (dispatch: ThunkDispatch<void, any, Action>, getState: () => AppState): void => {
  const { universe } = getState();
  if (universe.id == null) return callback(null);

  augur.augurNode.submitRequest(
    "getPlatformActivityStats",
    {
      universe: universe.id,
      startTime: options.startTime || null,
      endTime: null,
    },
    (err, result) => {
      if (err) return callback(err);

      dispatch(
        updateUniverse({
          result,
        } as any),
      );
    },
  );
};
