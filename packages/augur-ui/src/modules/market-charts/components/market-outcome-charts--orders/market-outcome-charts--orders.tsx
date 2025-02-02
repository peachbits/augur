import React, { Component } from "react";
import classNames from "classnames";

import MarketOutcomeChartHeaderOrders from "modules/market-charts/components/market-outcome-charts--header-orders/market-outcome-charts--header-orders";

import { ASKS, BIDS, BUY, SELL } from "modules/common/constants";
import MarketOutcomeMidpoint from "modules/market-charts/components/market-outcome-charts--midpoint/market-outcome-charts--midpoint";

import Styles from "modules/market-charts/components/market-outcome-charts--orders/market-outcome-charts--orders.styles.less";
import StylesHeader from "modules/market-charts/components/market-outcome-charts--header/market-outcome-charts--header.styles.less";
import { Order } from "modules/types";

function findTrailingZeros(num) {
  const zeros = num.match(/[0]+$/);
  if (num.toString().indexOf(".") === -1 || !zeros) {
    return "";
  }
  return (num % 1 === 0 ? "." : "") + zeros;
}

interface MarketOutcomeChartsOrdersProps {
  sharedChartMargins: {
    bottom: number;
  };
  orderBook: {
    asks: Array<Order>;
  };
  fixedPrecision: number;
  pricePrecision: number;
  updateHoveredPrice: Function;
  updateSelectedOrderProperties: Function;
  isMobile?: boolean;
  headerHeight: number;
  hasOrders: boolean;
  orderBookKeys: object;
}

interface MarketOutcomeChartHeaderOrdersState {
  hoveredOrderIndex: number | null;
  hoveredSide: any;
}

export default class MarketOutcomeChartsOrders extends Component<
  MarketOutcomeChartsOrdersProps,
  MarketOutcomeChartHeaderOrdersState
> {
  static defaultProps = {
    isMobile: false
  };

  constructor(props) {
    super(props);

    this.state = {
      hoveredOrderIndex: null,
      hoveredSide: null
    };
  }

  public asks: any;
  public bids: any;

  componentDidMount() {
    this.asks.scrollTop = this.asks.scrollHeight;
  }

  componentDidUpdate(prevProps) {
    const { orderBook } = this.props;
    if (
      prevProps.orderBook.asks.length &&
      JSON.stringify(prevProps.orderBook.asks) !==
        JSON.stringify(orderBook.asks)
    ) {
      this.asks.scrollTop = this.asks.scrollHeight;
    }
  }

  render() {
    const {
      fixedPrecision,
      pricePrecision,
      orderBook,
      sharedChartMargins,
      updateHoveredPrice,
      updateSelectedOrderProperties,
      isMobile,
      headerHeight,
      hasOrders,
      orderBookKeys
    } = this.props;
    const s = this.state;

    const orderBookAsks = orderBook.asks || [];

    return (
      <section
        className={Styles.MarketOutcomeOrderBook}
        style={{ paddingBottom: sharedChartMargins.bottom - 4 }}
      >
        <MarketOutcomeChartHeaderOrders
          isMobile={isMobile || false}
          headerHeight={headerHeight}
        />
        <div
          className={classNames(
            Styles.MarketOutcomeOrderBook__Side,
            Styles["MarketOutcomeOrderBook__side--asks"]
          )}
        >
          <div
            className={classNames(
              Styles.MarketOutcomeOrderBook__container,
              Styles["MarketOutcomeOrderBook__container--asks"]
            )}
            ref={asks => {
              this.asks = asks;
            }}
          >
            {orderBookAsks.map((order, i) => (
              <div
                key={order.cumulativeShares}
                className={classNames(Styles.MarketOutcomeOrderBook__row, {
                  [Styles["MarketOutcomeOrderBook__row--head-bid"]]:
                    i === orderBook.asks.length - 1,
                  [Styles["MarketOutcomeOrderBook__row--hover"]]:
                    i === s.hoveredOrderIndex && s.hoveredSide === ASKS,
                  [Styles["MarketOutcomeOrderbook__row--hover-encompassed"]]:
                    s.hoveredOrderIndex !== null &&
                    s.hoveredSide === ASKS &&
                    i > s.hoveredOrderIndex
                })}
                onMouseEnter={() => {
                  updateHoveredPrice(order.price.value);
                  this.setState({
                    hoveredOrderIndex: i,
                    hoveredSide: ASKS
                  });
                }}
                onMouseLeave={() => {
                  updateHoveredPrice(null);
                  this.setState({
                    hoveredOrderIndex: null,
                    hoveredSide: null
                  });
                }}
              >
                <button
                  className={Styles.MarketOutcomeOrderBook__RowItem_ask}
                  onClick={() =>
                    updateSelectedOrderProperties({
                      orderPrice: order.price.value.toString(),
                      orderQuantity: order.cumulativeShares.toString(),
                      selectedNav: BUY,
                      selfTrade: order.mySize !== null
                    })
                  }
                >
                  <span>
                    {order.shares.value.toFixed(fixedPrecision).toString()}
                  </span>
                </button>
                <button
                  className={Styles.MarketOutcomeOrderBook__RowItem_ask}
                  onClick={() =>
                    updateSelectedOrderProperties({
                      orderPrice: order.price.value.toString(),
                      orderQuantity: order.cumulativeShares.toString(),
                      selectedNav: BUY,
                      selfTrade: order.mySize !== null
                    })
                  }
                >
                  <span>
                    {parseFloat(order.price.value.toFixed(pricePrecision))}
                    <span style={{ color: "#6d1d3d", marginLeft: ".5px" }}>
                      {findTrailingZeros(
                        order.price.value.toFixed(pricePrecision)
                      )}
                    </span>
                  </span>
                </button>
                <button
                  className={Styles.MarketOutcomeOrderBook__RowItem_ask}
                  onClick={() =>
                    updateSelectedOrderProperties({
                      orderPrice: order.price.value.toString(),
                      orderQuantity: order.cumulativeShares.toString(),
                      selectedNav: BUY,
                      selfTrade: order.mySize !== null
                    })
                  }
                >
                  <span>
                    {order.mySize
                      ? order.mySize.value.toFixed(fixedPrecision).toString()
                      : "—"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={Styles.MarketOutcomeOrderBook__Midmarket}>
          <MarketOutcomeMidpoint
            hasOrders={hasOrders}
            orderBookKeys={orderBookKeys}
            pricePrecision={pricePrecision}
          />
        </div>
        <div
          className={classNames(
            Styles.MarketOutcomeOrderBook__Side,
            Styles["MarketOutcomeOrderBook__side--bids"]
          )}
        >
          <div
            className={Styles.MarketOutcomeOrderBook__container}
            ref={bids => {
              this.bids = bids;
            }}
          >
            {(orderBook.bids || []).map((order, i) => (
              <div
                key={order.cumulativeShares}
                className={classNames(Styles.MarketOutcomeOrderBook__row, {
                  [Styles["MarketOutcomeOrderBook__row--head-ask"]]: i === 0,
                  [Styles["MarketOutcomeOrderBook__row--hover"]]:
                    i === s.hoveredOrderIndex && s.hoveredSide === BIDS,
                  [Styles["MarketOutcomeOrderbook__row--hover-encompassed"]]:
                    s.hoveredOrderIndex !== null &&
                    s.hoveredSide === BIDS &&
                    i < s.hoveredOrderIndex
                })}
                onMouseEnter={() => {
                  updateHoveredPrice(order.price.value);
                  this.setState({
                    hoveredOrderIndex: i,
                    hoveredSide: BIDS
                  });
                }}
                onMouseLeave={() => {
                  updateHoveredPrice(null);
                  this.setState({
                    hoveredOrderIndex: null,
                    hoveredSide: null
                  });
                }}
              >
                <button
                  className={Styles.MarketOutcomeOrderBook__RowItem_bid}
                  onClick={() =>
                    updateSelectedOrderProperties({
                      orderPrice: order.price.value.toString(),
                      orderQuantity: order.cumulativeShares.toString(),
                      selectedNav: SELL,
                      selfTrade: order.mySize !== null
                    })
                  }
                >
                  <span>
                    {order.shares.value.toFixed(fixedPrecision).toString()}
                  </span>
                </button>
                <button
                  className={Styles.MarketOutcomeOrderBook__RowItem_bid}
                  onClick={() =>
                    updateSelectedOrderProperties({
                      orderPrice: order.price.value.toString(),
                      orderQuantity: order.cumulativeShares.toString(),
                      selectedNav: SELL,
                      selfTrade: order.mySize !== null
                    })
                  }
                >
                  <span>
                    {parseFloat(order.price.value.toFixed(pricePrecision))}
                    <span style={{ color: "#135045", marginLeft: ".5px" }}>
                      {findTrailingZeros(
                        order.price.value.toFixed(pricePrecision)
                      )}
                    </span>
                  </span>
                </button>
                <button
                  className={Styles.MarketOutcomeOrderBook__RowItem_bid}
                  onClick={() =>
                    updateSelectedOrderProperties({
                      orderPrice: order.price.value.toString(),
                      orderQuantity: order.cumulativeShares.toString(),
                      selectedNav: SELL,
                      selfTrade: order.mySize !== null
                    })
                  }
                >
                  <span>
                    {order.mySize
                      ? order.mySize.value.toFixed(fixedPrecision).toString()
                      : "—"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div
          className={classNames(
            StylesHeader.MarketOutcomeChartsHeader__stats,
            Styles.MarketOutcomeOrderBook__stats
          )}
        >
          <div
            className={StylesHeader["MarketOutcomeChartsHeader__stat--right"]}
          >
            <span
              className={StylesHeader["MarketOutcomeChartsHeader__stat-title"]}
            >
              bid qty
            </span>
          </div>
          <div
            className={StylesHeader["MarketOutcomeChartsHeader__stat--right"]}
          >
            <span
              className={StylesHeader["MarketOutcomeChartsHeader__stat-title"]}
            >
              price
            </span>
          </div>
          <div
            className={StylesHeader["MarketOutcomeChartsHeader__stat--right"]}
          >
            <span
              className={StylesHeader["MarketOutcomeChartsHeader__stat-title"]}
            >
              my size
            </span>
          </div>
        </div>
      </section>
    );
  }
}
