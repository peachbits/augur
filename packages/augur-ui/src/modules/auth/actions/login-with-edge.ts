import { prefixHex } from "speedomatic";
import { EDGE_WALLET_TYPE, ACCOUNT_TYPES } from "modules/common/constants";
import { loadAccountData } from "modules/auth/actions/load-account-data";
import {
  updateAuthStatus,
  IS_LOGGED
} from "modules/auth/actions/auth-status";
import logError from "utils/log-error";
import { ThunkDispatch } from "redux-thunk";
import { Action } from "redux";
import { NodeStyleCallback } from "modules/types";

export const loginWithEdgeEthereumWallet = (
  edgeUiAccount: any,
  ethereumWallet: any,
  history: any
) => (dispatch: ThunkDispatch<void, any, Action>) => {
  const mixedCaseAddress: string = ethereumWallet.keys.ethereumAddress;
  const lowerCaseAddress: string = mixedCaseAddress.toLowerCase();
  dispatch(updateAuthStatus(IS_LOGGED, true));
  dispatch(
    loadAccountData({
      address: lowerCaseAddress,
      displayAddress: mixedCaseAddress,
      meta: {
        address: lowerCaseAddress,
        signer: (tx: any, callback: NodeStyleCallback) => {
          edgeUiAccount
            .signEthereumTransaction(ethereumWallet.id, tx)
            .then(signed => callback(null, prefixHex(signed)))
            .catch(e => callback(e));
        },
        accountType: ACCOUNT_TYPES.EDGE
      },
      name: edgeUiAccount.username,
      edgeUiAccount
    })
  );
};

export const loginWithEdge = (
  edgeAccount: any,
  history: any,
  callback: NodeStyleCallback = logError
) => (dispatch: ThunkDispatch<void, any, Action>) => {
  const ethereumWallet = edgeAccount.getFirstWalletInfo(EDGE_WALLET_TYPE);
  if (ethereumWallet != null) {
    return dispatch(
      loginWithEdgeEthereumWallet(edgeAccount, ethereumWallet, history)
    );
  }

  // Create an ethereum wallet if one doesn't exist
  edgeAccount
    .createCurrencyWallet(EDGE_WALLET_TYPE)
    .then(() => {
      const ethereumWallet = edgeAccount.getFirstWalletInfo(EDGE_WALLET_TYPE);
      dispatch(
        loginWithEdgeEthereumWallet(edgeAccount, ethereumWallet, history)
      );
    })
    .catch(() => logError({ code: 0, message: "could not create wallet" }));
};
