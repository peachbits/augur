import { createStore, combineReducers, applyMiddleware, compose, Middleware, ReducersMapObject } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";

import { helpers } from "helpers/helpers";

import thunk from "redux-thunk";

import { createReducer, AppStateInterface } from "reducers";
import { windowRef } from "utils/window-ref";
import { augur } from "services/augurjs";
import { processFavorites } from "modules/markets/helpers/favorites-processor";
import { getNetworkId } from "modules/contracts/actions/contractCalls";
import { WindowApp } from "modules/types";

// console log middleware
const consoleLog = store => next => action => {
  if (!action) return;
  const isIgnoreFlag = action.meta != null && action.meta.ignore === true;
  if (typeof action !== "function" && !isIgnoreFlag) {
    // console.log(action);
  }
  return next(action);
};

// local storage middleware
const localStorageMiddleware = store => next => action => {
  next(action);
  const state = store.getState() as AppState;
  if (!state || !state.loginAccount || !state.loginAccount.address) {
    return;
  }
  const { address } = state.loginAccount;
  const {
    pendingLiquidityOrders,
    favorites,
    reports,
    alerts,
    readNotifications,
    pendingOrders,
    pendingQueue,
    env,
    connection
  } = state;
  const windowApp: WindowApp = windowRef as WindowApp;
  if (windowApp.localStorage && windowApp.localStorage.setItem) {
    const { localStorage } = windowApp;
    // TODO: defaulting augur node, all augur-node references will be removed
    const { augurNodeNetworkId = 0, isConnected } = connection;
    const networkIdToUse: number = isConnected ? getNetworkId() : augurNodeNetworkId;
    const universeIdToUse =
      env.universe || augur.contracts.addresses[networkIdToUse].Universe;
    const accountValue = localStorage.getItem(address) || "{}";
    let storedAccountData = JSON.parse(accountValue);
    if (!storedAccountData || !storedAccountData.selectedUniverse) {
      storedAccountData = {
        selectedUniverse: { [networkIdToUse]: universeIdToUse }
      };
    }
    const processedFavorites = processFavorites(
      favorites,
      storedAccountData.favorites,
      networkIdToUse,
      universeIdToUse
    );
    localStorage.setItem(
      address,
      JSON.stringify({
        pendingLiquidityOrders,
        favorites: processedFavorites,
        reports,
        alerts,
        readNotifications,
        pendingOrders,
        pendingQueue,
        gasPriceInfo: {
          userDefinedGasPrice: state.gasPriceInfo.userDefinedGasPrice
        },
        selectedUniverse: {
          ...storedAccountData.selectedUniverse
        }
      })
    );
  }
};

let middleware;

if (process.env.NODE_ENV === "production") {
  middleware = applyMiddleware(thunk, localStorageMiddleware as Middleware);
} else {
  const whenever = require("redux-whenever");
  middleware = compose(
    whenever,
    composeWithDevTools({})(
      applyMiddleware(consoleLog, thunk, localStorageMiddleware as Middleware)
    )
  );
}

const rootReducers = createReducer();
// middleware
const store = createStore(
  combineReducers({...rootReducers }), middleware,
);

export type AppState = AppStateInterface;

// Keep a copy of the state on the window object for debugging.
if (process.env.NODE_ENV !== "test") {
  Object.defineProperty(window, "state", {
    get: store.getState,
    enumerable: true
  });
}

if (process.env.NODE_ENV === "development") {
  (window as WindowApp).integrationHelpers = helpers(store);
}

if ((module as any).hot) {
  (module as any).hot.accept("./reducers", changed => {
    const nextReducers = require("reducers");
    store.replaceReducer(
      combineReducers({
        ...nextReducers.createReducer()
      })
    );
  });

  Object.defineProperty(window, "state", {
    get: store.getState,
    enumerable: true
  });
}

export default store;
