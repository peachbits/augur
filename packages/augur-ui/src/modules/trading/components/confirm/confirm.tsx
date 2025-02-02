import React, { Component } from "react";
import PropTypes from "prop-types";
import { augur } from "services/augurjs";
import classNames from "classnames";
import {
  SCALAR,
  YES_NO,
  BUY,
  SELL,
  ZERO,
  BUYING,
  SELLING,
  BUYING_BACK,
  SELLING_OUT,
  WARNING,
  ERROR,
  UPPER_FIXED_PRECISION_BOUND
} from "modules/common/constants";
import ReactTooltip from "react-tooltip";
import TooltipStyles from "modules/common/tooltip.styles";
import Styles from "modules/trading/components/confirm/confirm.styles";
import {
  XIcon,
  ExclamationCircle,
  InfoIcon
} from "modules/common/icons";
import { formatGasCostToEther, formatShares } from "utils/format-number";
import { BigNumber, createBigNumber } from "utils/create-big-number";
import { LinearPropertyLabel } from "modules/common/labels";

class Confirm extends Component {
  static propTypes = {
    trade: PropTypes.shape({
      numShares: PropTypes.string,
      limitPrice: PropTypes.string,
      potentialEthProfit: PropTypes.object,
      potentialEthLoss: PropTypes.object,
      totalCost: PropTypes.object,
      shareCost: PropTypes.object,
      orderShareProfit: PropTypes.object,
      orderShareTradingFee: PropTypes.object
    }).isRequired,
    gasPrice: PropTypes.number.isRequired,
    availableFunds: PropTypes.instanceOf(BigNumber).isRequired,
    selectedOutcome: PropTypes.object.isRequired,
    marketType: PropTypes.string.isRequired,
    maxPrice: PropTypes.instanceOf(BigNumber).isRequired,
    minPrice: PropTypes.instanceOf(BigNumber).isRequired,
    scalarDenomination: PropTypes.string
  };

  static defaultProps = {
    scalarDenomination: ""
  };

  constructor(props) {
    super(props);
    this.state = {
      messages: this.constructMessages(props)
    };

    this.constructMessages = this.constructMessages.bind(this);
    this.clearErrorMessage = this.clearErrorMessage.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { trade, gasPrice, availableFunds } = this.props;
    if (
      trade !== nextProps.trade ||
      gasPrice !== nextProps.gasPrice ||
      availableFunds !== nextProps.availableFunds
    ) {
      this.setState({
        messages: this.constructMessages(nextProps)
      });
    }
  }

  constructMessages(props) {
    const { trade, numOutcomes, gasPrice, availableFunds } =
      props || this.props;

    const { totalCost, selfTrade } = trade;

    let messages = null;
    const gasValues = {
      fillGasLimit: augur.constants.WORST_CASE_FILL[numOutcomes],
      placeOrderNoSharesGasLimit:
        augur.constants.PLACE_ORDER_NO_SHARES[numOutcomes],
      placeOrderWithSharesGasLimit:
        augur.constants.PLACE_ORDER_WITH_SHARES[numOutcomes]
    };
    const gas =
      trade.shareCost.fullPrecision > 0
        ? gasValues.placeOrderWithSharesGasLimit
        : gasValues.fillGasLimit;
    const gasCost = formatGasCostToEther(gas, { decimalsRounded: 4 }, gasPrice);
    const tradeTotalCost = createBigNumber(totalCost.fullPrecision, 10);

    if (selfTrade) {
      messages = {
        header: "CONSUMING OWN ORDER",
        type: WARNING,
        message: "You are trading against one of your existing orders"
      };
    }

    if (
      tradeTotalCost.gt(ZERO) &&
      createBigNumber(gasCost).gt(createBigNumber(tradeTotalCost))
    ) {
      messages = {
        header: "Gas Higher than Order",
        type: WARNING,
        message: `Est. gas cost ${gasCost} ETH, higher than order cost`
      };
    }

    if (
      totalCost &&
      createBigNumber(totalCost.fullPrecision, 10).gte(
        createBigNumber(availableFunds, 10)
      )
    ) {
      messages = {
        header: "Insufficient Funds",
        type: ERROR,
        message: "You do not have enough funds to place this order"
      };
    }

    return messages;
  }

  clearErrorMessage() {
    this.setState({ messages: null });
  }

  render() {
    const {
      trade,
      selectedOutcome,
      marketType,
      maxPrice,
      minPrice,
      scalarDenomination
    } = this.props;

    const {
      limitPrice,
      numShares,
      potentialEthProfit,
      potentialEthLoss,
      totalCost,
      shareCost,
      side,
      orderShareProfit,
      orderShareTradingFee
    } = trade;

    const { messages } = this.state;

    const outcomeName =
      marketType === YES_NO ? "this event" : selectedOutcome.name;
    const greaterLess = side === BUY ? "greater" : "less";
    const higherLower = side === BUY ? "higher" : "lower";

    const marketRange = maxPrice.minus(minPrice).abs();

    const limitPricePercentage = (side === BUY
      ? createBigNumber(limitPrice)
      : maxPrice.minus(createBigNumber(limitPrice))
    )
      .dividedBy(marketRange)
      .times(100)
      .toFixed(0);

    let tooltip = `You believe ${outcomeName} has a ${greaterLess}
                        than ${limitPricePercentage}% chance to occur.`;
    if (marketType === SCALAR) {
      tooltip = `You believe the outcome of this event will be ${higherLower}
    than ${limitPrice} ${scalarDenomination}`;
    }

    let newOrderAmount = formatShares("0").rounded;
    if (numShares && totalCost.fullPrecision && shareCost.fullPrecision) {
      newOrderAmount = formatShares(
        createBigNumber(numShares).minus(shareCost.fullPrecision),
        {
          decimalsRounded: UPPER_FIXED_PRECISION_BOUND
        }
      ).rounded;
    }

    const notProfitable =
      (orderShareProfit && createBigNumber(orderShareProfit.value).lte(0)) ||
      (totalCost.value > 0 &&
        potentialEthProfit &&
        potentialEthProfit.value <= 0);

    return (
      <section className={Styles.TradingConfirm}>
        {((shareCost && shareCost.value !== 0) ||
          (totalCost && totalCost.value !== 0)) && (
          <div className={Styles.TrandingConfirm__topBorder} />
        )}
        {shareCost &&
          shareCost.value !== 0 && (
            <div className={Styles.TradingConfirm__details}>
              <div className={Styles.TradingConfirm__position__properties}>
                CLOSING POSITION
              </div>
              <div className={Styles.TradingConfirm__agg_position}>
                <span
                  className={classNames({
                    [Styles.long]: side === BUY,
                    [Styles.short]: side === SELL
                  })}
                >
                  {side !== BUY ? SELLING_OUT : BUYING_BACK}
                </span>
                <span> {shareCost.fullPrecision} </span>
                Shares @ <span> {limitPrice}</span>
              </div>
              <LinearPropertyLabel
                label="Estimated Fee"
                value={`${orderShareTradingFee.rounded} ETH`}
              />
              <LinearPropertyLabel
                label="Profit"
                value={`${orderShareProfit.rounded} ETH`}
                accentValue={notProfitable}
              />
            </div>
          )}
        {totalCost &&
          totalCost.value !== 0 && (
            <div className={Styles.TradingConfirm__details}>
              <div
                className={classNames(
                  Styles.TradingConfirm__position__properties,
                  Styles.TradingConfirm__position__tooltipContainer
                )}
              >
                NEW POSITION
                <span className={Styles.TradingConfirm__TooltipContainer}>
                  <label
                    className={classNames(
                      TooltipStyles.TooltipHint,
                      Styles.TradingConfirm__TooltipHint
                    )}
                    data-tip
                    data-for="tooltip--confirm"
                  >
                    {InfoIcon}
                  </label>
                  <ReactTooltip
                    id="tooltip--confirm"
                    className={TooltipStyles.Tooltip}
                    effect="solid"
                    place="top"
                    type="light"
                  >
                    <p>{tooltip}</p>
                  </ReactTooltip>
                </span>
              </div>
              <div className={Styles.TradingConfirm__agg_position}>
                <span
                  className={classNames({
                    [Styles.long]: side === BUY,
                    [Styles.short]: side === SELL
                  })}
                >
                  {side === BUY ? BUYING : SELLING}
                </span>
                <span> {newOrderAmount} </span>
                Shares @ <span> {limitPrice}</span>
              </div>
              <LinearPropertyLabel
                label="Max Profit"
                value={`${potentialEthProfit.rounded} ETH`}
              />
              <LinearPropertyLabel
                label="Max Loss"
                value={`${potentialEthLoss.rounded} ETH`}
              />
            </div>
          )}
        {messages && (
          <div
            className={classNames(
              Styles.TradingConfirm__error_message_container,
              {
                [Styles.error]: messages.type === ERROR
              }
            )}
          >
            <div
              className={classNames({
                [Styles.TradingConfirm__message__warning]:
                  messages.type === WARNING,
                [Styles.TradingConfirm__message__error]: messages.type === ERROR
              })}
            >
              {ExclamationCircle}
              <span>{messages.header}</span>
              {messages.type !== ERROR && (
                <button onClick={this.clearErrorMessage}>{XIcon}</button>
              )}
            </div>
            <div>{messages.message}</div>
          </div>
        )}
      </section>
    );
  }
}

export default Confirm;
