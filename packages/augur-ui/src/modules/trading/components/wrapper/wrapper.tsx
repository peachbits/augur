import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { BigNumber, createBigNumber } from "utils/create-big-number";

import Form from "modules/trading/components/form/form";
import Confirm from "modules/trading/components/confirm/confirm";
import { generateTrade } from "modules/trades/helpers/generate-trade";
import getValue from "utils/get-value";
import {
  SCALAR,
  BUY,
  SELL,
  UPPER_FIXED_PRECISION_BOUND
} from "modules/common/constants";
import Styles from "modules/trading/components/wrapper/wrapper.styles";
import { OrderButton } from "modules/common/buttons";
import { formatShares } from "utils/format-number";
import convertExponentialToDecimal from "utils/convert-exponential";
// TODO: refactor the need to use this function.
function pick(object, keys) {
  return keys.reduce((obj, key) => {
     if (object && object.hasOwnProperty(key)) {
        obj[key] = object[key];
     }
     return obj;
   }, {});
}

class Wrapper extends Component {
  static propTypes = {
    market: PropTypes.object.isRequired,
    marketReviewTradeSeen: PropTypes.bool.isRequired,
    marketReviewTradeModal: PropTypes.func.isRequired,
    selectedOrderProperties: PropTypes.object.isRequired,
    availableFunds: PropTypes.instanceOf(BigNumber).isRequired,
    selectedOutcome: PropTypes.object,
    updateSelectedOrderProperties: PropTypes.func.isRequired,
    handleFilledOnly: PropTypes.func.isRequired,
    gasPrice: PropTypes.number.isRequired,
    updateSelectedOutcome: PropTypes.func.isRequired,
    updateTradeCost: PropTypes.func.isRequired,
    updateTradeShares: PropTypes.func.isRequired,
    onSubmitPlaceTrade: PropTypes.func.isRequired
  };

  static defaultProps = {
    selectedOutcome: null
  };

  static getDefaultTrade(props) {
    if (!(props.market || {}).marketType || !(props.selectedOutcome || {}).id)
      return null;
    return generateTrade(
      {
        id: props.market.id,
        settlementFee: props.market.settlementFee,
        marketType: props.market.marketType,
        maxPrice: props.market.maxPrice,
        minPrice: props.market.minPrice,
        cumulativeScale: props.market.cumulativeScale,
        makerFee: props.market.makerFee
      },
      {}
    );
  }

  constructor(props) {
    super(props);

    this.state = {
      orderPrice: props.selectedOrderProperties.price || "",
      orderQuantity: props.selectedOrderProperties.quantity || "",
      orderEthEstimate: "",
      orderEscrowdEth: "",
      selectedNav: props.selectedOrderProperties.selectedNav || BUY,
      doNotCreateOrders:
        props.selectedOrderProperties.doNotCreateOrders || false
    };

    this.updateState = this.updateState.bind(this);
    this.clearOrderForm = this.clearOrderForm.bind(this);
    this.updateTradeTotalCost = this.updateTradeTotalCost.bind(this);
    this.updateTradeNumShares = this.updateTradeNumShares.bind(this);
    this.updateOrderProperty = this.updateOrderProperty.bind(this);
    this.updateNewOrderProperties = this.updateNewOrderProperties.bind(this);
    this.clearOrderConfirmation = this.clearOrderConfirmation.bind(this);
  }

  componentWillMount() {
    this.setState({
      ...this.state,
      trade: Wrapper.getDefaultTrade(this.props)
    });
  }

  componentWillUpdate(nextProps) {
    const { selectedOrderProperties } = this.props;

    if (
      JSON.stringify(selectedOrderProperties) !==
      JSON.stringify(nextProps.selectedOrderProperties)
    ) {
      if (
        nextProps.selectedOrderProperties.orderPrice !==
          this.state.orderPrice ||
        nextProps.selectedOrderProperties.orderQuantity !==
          this.state.orderQuantity ||
        nextProps.selectedOrderProperties.selectedNav !== this.state.selectedNav
      ) {
        if (
          !nextProps.selectedOrderProperties.orderPrice &&
          !nextProps.selectedOrderProperties.orderQuantity
        ) {
          return this.clearOrderForm();
        }

        this.updateTradeTotalCost(
          {
            ...nextProps.selectedOrderProperties,
            orderQuantity: convertExponentialToDecimal(
              nextProps.selectedOrderProperties.orderQuantity
            )
          },
          true
        );
      }
    }
  }

  updateState(stateValues, cb) {
    this.setState(currentState => ({ ...currentState, ...stateValues }), cb);
  }

  clearOrderConfirmation() {
    const trade = Wrapper.getDefaultTrade(this.props);
    this.setState({ trade });
  }

  clearOrderForm(wholeForm = true) {
    const trade = Wrapper.getDefaultTrade(this.props);

    if (wholeForm) {
      this.updateState(
        {
          orderPrice: "",
          orderQuantity: "",
          orderEthEstimate: "",
          orderEscrowdEth: "",
          doNotCreateOrders: false,
          selectedNav: this.state.selectedNav,
          trade
        },
        () => {
          this.updateParentOrderValues();
        }
      );
    } else {
      this.updateState(
        {
          trade
        },
        () => {
          this.updateParentOrderValues();
        }
      );
    }
  }

  updateParentOrderValues() {
    this.props.updateSelectedOrderProperties({
      ...pick(this.state, Object.keys(this.props.selectedOrderProperties))
    });
  }

  updateNewOrderProperties(selectedOrderProperties) {
    this.updateTradeTotalCost({ ...selectedOrderProperties }, true);
  }

  updateOrderProperty(property, callback) {
    const values = {
      ...property
    };
    this.updateState(values, () => {
      this.updateParentOrderValues();
      if (callback) callback();
    });
  }

  updateTradeTotalCost(order, fromOrderBook = false) {
    const { updateTradeCost, selectedOutcome, market } = this.props;
    let useValues = {
      ...order,
      orderEthEstimate: ""
    };
    if (!fromOrderBook) {
      useValues = {
        ...this.state,
        orderEthEstimate: ""
      };
    }
    this.updateState(
      {
        ...this.state,
        ...useValues
      },
      () => {
        updateTradeCost(
          market.id,
          selectedOutcome.id,
          {
            limitPrice: order.orderPrice,
            side: order.selectedNav,
            numShares: order.orderQuantity,
            selfTrade: order.selfTrade
          },
          (err, newOrder) => {
            if (err) {
              // just update properties for form
              return this.updateState({
                ...this.state,
                ...order,
                orderEthEstimate: "",
                orderEscrowdEth: ""
              });
            }

            const newOrderEthEstimate = formatShares(
              createBigNumber(newOrder.totalOrderValue.fullPrecision),
              {
                decimalsRounded: UPPER_FIXED_PRECISION_BOUND
              }
            ).rounded;

            this.updateState({
              ...this.state,
              ...order,
              orderEthEstimate: newOrderEthEstimate,
              orderEscrowdEth: newOrder.potentialEthLoss.formatted,
              trade: newOrder
            });
          }
        );
      }
    );
  }

  placeTrade(market, selectedOutcome, s) {
    this.props.onSubmitPlaceTrade(
      market.id,
      selectedOutcome.id,
      s.trade,
      s.doNotCreateOrders,
      (err, tradeGroupID) => {
        // onSent/onFailed CB
        if (!err) {
          this.clearOrderForm();
        }
      },
      res => {
        if (s.doNotCreateOrders && res.res !== res.sharesToFill) {
          this.props.handleFilledOnly(res.tradeInProgress);
          // onComplete CB
        }
      }
    );
  }

  updateTradeNumShares(order) {
    const { updateTradeShares, selectedOutcome, market } = this.props;
    this.updateState(
      {
        ...order,
        orderQuantity: "",
        orderEscrowdEth: ""
      },
      () =>
        updateTradeShares(
          market.id,
          selectedOutcome.id,
          {
            limitPrice: order.orderPrice,
            side: order.selectedNav,
            maxCost: order.orderEthEstimate
          },
          (err, newOrder) => {
            if (err) return console.log(err); // what to do with error here

            const numShares = formatShares(
              createBigNumber(newOrder.numShares),
              {
                decimalsRounded: UPPER_FIXED_PRECISION_BOUND
              }
            ).rounded;

            this.updateState(
              {
                ...this.state,
                ...order,
                orderQuantity: numShares,
                orderEscrowdEth: newOrder.potentialEthLoss.formatted,
                trade: newOrder
              },
              () => {
                this.updateParentOrderValues();
              }
            );
          }
        )
    );
  }

  render() {
    const {
      availableFunds,
      market,
      selectedOutcome,
      gasPrice,
      updateSelectedOutcome,
      marketReviewTradeSeen,
      marketReviewTradeModal
    } = this.props;
    const s = this.state;
    const {
      selectedNav,
      orderPrice,
      orderQuantity,
      orderEthEstimate,
      orderEscrowdEth,
      doNotCreateOrders
    } = s;

    return (
      <section className={Styles.Wrapper}>
        <div>
          <ul
            className={classNames({
              [Styles.Buy]: selectedNav === BUY,
              [Styles.Sell]: selectedNav === SELL,
              [Styles.Scalar]: market.marketType === SCALAR
            })}
          >
            <li
              className={classNames({
                [`${Styles.active}`]: selectedNav === BUY
              })}
            >
              <button
                onClick={() =>
                  this.updateTradeTotalCost({
                    ...s,
                    selectedNav: BUY
                  })
                }
              >
                <div>Buy Shares</div>
                <span
                  className={classNames({
                    [`${Styles.notActive}`]: selectedNav === SELL
                  })}
                />
              </button>
            </li>
            <li
              className={classNames({
                [`${Styles.active}`]: selectedNav === SELL
              })}
            >
              <button
                onClick={() =>
                  this.updateTradeTotalCost({
                    ...s,
                    selectedNav: SELL
                  })
                }
              >
                <div>Sell Shares</div>
                <span
                  className={classNames({
                    [`${Styles.notActive}`]: selectedNav === BUY
                  })}
                />
              </button>
            </li>
          </ul>
          {market && market.marketType && (
            <Form
              market={market}
              marketType={getValue(this.props, "market.marketType")}
              maxPrice={getValue(this.props, "market.maxPrice")}
              minPrice={getValue(this.props, "market.minPrice")}
              selectedNav={selectedNav}
              orderPrice={orderPrice}
              orderQuantity={orderQuantity}
              orderEthEstimate={orderEthEstimate}
              orderEscrowdEth={orderEscrowdEth}
              doNotCreateOrders={doNotCreateOrders}
              selectedOutcome={selectedOutcome}
              updateState={this.updateState}
              updateOrderProperty={this.updateOrderProperty}
              clearOrderForm={this.clearOrderForm}
              updateSelectedOutcome={updateSelectedOutcome}
              updateTradeTotalCost={this.updateTradeTotalCost}
              updateTradeNumShares={this.updateTradeNumShares}
              updateNewOrderProperties={this.updateNewOrderProperties}
              clearOrderConfirmation={this.clearOrderConfirmation}
            />
          )}
        </div>
        {s.trade &&
          (s.trade.shareCost.value !== 0 || s.trade.totalCost.value !== 0) && (
            <Confirm
              numOutcomes={market.numOutcomes}
              marketType={getValue(this.props, "market.marketType")}
              maxPrice={getValue(this.props, "market.maxPrice")}
              minPrice={getValue(this.props, "market.minPrice")}
              trade={s.trade.displayTrade}
              gasPrice={gasPrice}
              availableFunds={availableFunds}
              selectedOutcome={selectedOutcome}
              scalarDenomination={market.scalarDenomination}
            />
          )}
        <div
          className={classNames({
            [Styles.Full]:
              s.trade &&
              (s.trade.shareCost.value !== 0 || s.trade.totalCost.value !== 0)
          })}
        >
          <OrderButton
            type={selectedNav}
            action={e => {
              e.preventDefault();
              if (!marketReviewTradeSeen) {
                marketReviewTradeModal({
                  marketId: market.id,
                  cb: () => this.placeTrade(market, selectedOutcome, s)
                });
              } else {
                this.placeTrade(market, selectedOutcome, s);
              }
            }}
            disabled={!s.trade || !s.trade.limitPrice}
          />
        </div>
      </section>
    );
  }
}

export default Wrapper;
