import React, { Component } from "react";
import classNames from "classnames";
import { Helmet } from "react-helmet";

import * as speedomatic from "speedomatic";
import { formatGasCostToEther } from "utils/format-number";
import MarketPreview from "modules/market/containers/market-preview";
import NullStateMessage from "modules/common/null-state-message";
import MigrateRepForm from "modules/forking/components/migrate-rep-form";
import MigrateRepConfirm from "modules/forking/components/migrate-rep-confirm";
import { TYPE_VIEW } from "modules/common/constants";
import { isEmpty } from "utils/is-populated";
import FormStyles from "modules/common/form-styles.less";
import Styles from "modules/reporting/components/reporting-report/reporting-report.styles.less";
import { MarketData } from "modules/types";

interface MirgrateRepProps {
  accountREP: string;
  getForkMigrationTotals: (...args: Array<any>) => any;
  history: History;
  isConnected: boolean;
  isLogged: boolean;
  isMarketLoaded: boolean;
  loadFullMarket: Function;
  location: Location;
  market: MarketData;
  marketId: string;
  submitMigrateREP: Function;
  currentBlockNumber: number;
  gasPrice: string;
}

interface MirgrateRepState {
  currentStep: number;
  isMarketInValid: any;
  selectedOutcome: string;
  selectedOutcomeName: string;
  repAmount: string;
  validations: {
    repAmount: boolean;
    selectedOutcome: any;
  };
  gasEstimate: string;
  forkMigrationTotals: any;
}

export default class MigrateRep extends Component<MirgrateRepProps, MirgrateRepState> {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      isMarketInValid: null,
      selectedOutcome: "",
      selectedOutcomeName: "",
      repAmount: "",
      validations: {
        repAmount: false,
        selectedOutcome: null,
      },
      gasEstimate: "0",
      forkMigrationTotals: null,
    };

    this.prevPage = this.prevPage.bind(this);
    this.nextPage = this.nextPage.bind(this);
    this.updateState = this.updateState.bind(this);
  }

  componentWillMount() {
    const { isConnected, isMarketLoaded, loadFullMarket } = this.props;
    if (isConnected && !isMarketLoaded) {
      loadFullMarket();
    }
  }

  prevPage() {
    this.setState({
      currentStep: this.state.currentStep <= 0 ? 0 : this.state.currentStep - 1
    });
  }

  nextPage() {
    this.setState({
      currentStep: this.state.currentStep >= 1 ? 1 : this.state.currentStep + 1
    });
    // estimate gas, user is moving to confirm
    this.calculateGasEstimates();
  }

  updateState(newState) {
    this.setState(newState);
  }

  calculateGasEstimates() {
    const { submitMigrateREP, market, gasPrice } = this.props;
    if (this.state.repAmount !== "") {
      const amount = speedomatic.fix(this.state.repAmount, "hex");
      submitMigrateREP({
        estimateGas: true,
        marketId: market.id,
        selectedOutcome: this.state.selectedOutcome,
        invalid: this.state.isMarketInValid,
        amount,
        history: null,
        callback: (err, gasEstimateValue) => {
          if (err) return console.error(err);

          this.setState({
            gasEstimate: formatGasCostToEther(
              gasEstimateValue,
              { decimalsRounded: 4 },
              gasPrice,
            )
          });
        }
      });
    }
  }

  render() {
    const {
      accountREP,
      history,
      isLogged,
      location,
      market,
      submitMigrateREP,
      getForkMigrationTotals,
      currentBlockNumber,
    } = this.props;
    const s = this.state;

    return (
      <section>
        <Helmet>
          <title>Submit Dispute</title>
        </Helmet>
        {!isEmpty(market) && (
          <MarketPreview
            {...market}
            isLogged={isLogged}
            location={location}
            history={history}
            cardStyle="single-card"
            linkType={TYPE_VIEW}
            buttonText="View"
            showAdditionalDetailsToggle
          />
        )}
        {!isEmpty(market) && (
          <article className={FormStyles.Form}>
            {s.currentStep === 0 && (
              <MigrateRepForm
                market={market}
                updateState={this.updateState}
                selectedOutcome={s.selectedOutcome}
                selectedOutcomeName={s.selectedOutcomeName}
                validations={s.validations}
                accountREP={accountREP}
                getForkMigrationTotals={getForkMigrationTotals}
                currentBlockNumber={currentBlockNumber}
              />
            )}
            {s.currentStep === 1 && (
              <MigrateRepConfirm
                selectedOutcomeName={s.selectedOutcomeName}
                repAmount={s.repAmount}
                gasEstimate={s.gasEstimate}
              />
            )}
            <div className={FormStyles.Form__navigation}>
              <button
                className={classNames(FormStyles.Form__prev, {
                  [`${FormStyles["hide-button"]}`]: s.currentStep === 0
                })}
                onClick={this.prevPage}
              >
                Previous
              </button>
              <button
                className={classNames(FormStyles.Form__next, {
                  [`${FormStyles["hide-button"]}`]: s.currentStep === 1
                })}
                disabled={
                  !Object.keys(s.validations).every(
                    (key) => s.validations[key] === true,
                  )
                }
                onClick={
                  Object.keys(s.validations).every(
                    (key) => s.validations[key] === true,
                  )
                    ? this.nextPage
                    : undefined
                }
              >
                Review
              </button>
              {s.currentStep === 1 && (
                <button
                  className={FormStyles.Form__submit}
                  onClick={() =>
                    submitMigrateREP({
                      estimateGas: false,
                      marketId: market.id,
                      selectedOutcome: s.selectedOutcome,
                      invalid: s.isMarketInValid,
                      amount: speedomatic.fix(s.repAmount, "hex"),
                      history,
                    })
                  }
                >
                  Submit
                </button>
              )}
            </div>
          </article>
        )}
        {isEmpty(market) && (
          <div className={Styles.NullState}>
            <NullStateMessage
              message="Market not found"
              className={Styles.NullState}
              addNullPadding={false}
            />
          </div>
        )}
      </section>
    );
  }
}
