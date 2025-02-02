import React, { Component } from "react";
import ForkingContent from "modules/forking/components/forking-content";
import ChevronFlip from "modules/common/chevron-flip";
import Styles from "modules/forking/components/forking-alert.styles.less";
import { Universe } from "modules/types";

interface ForkingAlertProps {
  location: Location;
  universe: Universe;
  currentTime: number;
  doesUserHaveRep: boolean;
  marginLeft: number;
  finalizeMarket: (...args: Array<any>) => any;
}

class ForkingAlert extends Component<ForkingAlertProps, { isExpanded: boolean }> {
  static defaultProps = {
    marginLeft: 0,
  };

  constructor(props) {
    super(props);

    this.state = {
      isExpanded: false,
    };

    this.expand = this.expand.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { location } = this.props;
    if (nextProps.location !== location) {
      this.setState({
        isExpanded: false,
      });
    }
  }

  expand() {
    this.setState({
      isExpanded: !this.state.isExpanded,
    });
  }

  render() {
    const {
      currentTime,
      doesUserHaveRep,
      marginLeft,
      universe,
      finalizeMarket,
    } = this.props;
    const {
      forkEndTime,
      forkingMarket,
      isForkingMarketFinalized,
      forkReputationGoal,
    } = universe;
    const forkWindowActive = Number(forkEndTime) > currentTime;

    return (
      <section className={Styles.ForkingAlert__Container}>
        <header className={Styles.ForkingAlert} style={{ marginLeft }}>
          <section>
            <img
              className={Styles.ForkingAlert__AlertIcon}
              alt="Alert"
              src="../../assets/images/alert-icon.svg"
            />
            {forkWindowActive && (
              <div className={Styles.ForkingAlert__message}>
                A Fork has been initiated. This universe is now locked.
              </div>
            )}
            {!forkWindowActive && (
              <div className={Styles.ForkingAlert__message}>
                A Fork has occurred. This universe is now locked.
              </div>
            )}
            <div className={Styles.ForkingAlert__addition_details}>
              <button
                className={Styles.ForkingAlert__addition_details_button}
                onClick={this.expand}
              >
                Additional details
                <span className={Styles.ForkingAlert__arrow}>
                  <ChevronFlip
                    pointDown={!this.state.isExpanded}
                    stroke="white"
                  />
                </span>
              </button>
            </div>
          </section>
        </header>
        {this.state.isExpanded && (
          <ForkingContent
            forkingMarket={forkingMarket}
            forkEndTime={forkEndTime}
            currentTime={currentTime}
            expanded
            doesUserHaveRep={doesUserHaveRep}
            forkReputationGoal={forkReputationGoal}
            finalizeMarket={finalizeMarket}
            isForkingMarketFinalized={isForkingMarketFinalized}
            marginLeft={marginLeft}
          />
        )}
      </section>
    );
  }
}

export default ForkingAlert;
