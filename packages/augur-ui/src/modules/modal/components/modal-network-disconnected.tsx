import React, { Component } from "react";
import PropTypes from "prop-types";

import ModalNetworkConnect from "modules/modal/containers/modal-network-connect";
import ModalLoading from "modules/modal/components/common/modal-loading";

import commonStyles from "modules/modal/components/common/common.styles.less";

import getValue from "utils/get-value";
import { EnvObject } from "modules/types";

interface ModalNetworkDisconnectedProps {
  modal: {
    env: EnvObject;
    connection: object;
  };
  updateIsReconnectionPaused: Function;
}

interface ModalNetworkDisconnectedState {
  [x: number]: any;
  showEnvForm: boolean;
}

export default class ModalNetworkDisconnected extends Component<ModalNetworkDisconnectedProps, ModalNetworkDisconnectedState> {
  constructor(props) {
    super(props);

    this.state = {
      showEnvForm: false,
    };

    this.showForm = this.showForm.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.updateField = this.updateField.bind(this);
  }

  showForm(e) {
    const { updateIsReconnectionPaused } = this.props;
    const { showEnvForm } = this.state;
    this.setState({ showEnvForm: !showEnvForm });
    // if the form is going to be shown, we pass true to pause reconnection
    updateIsReconnectionPaused(!showEnvForm);
  }

  submitForm(e, env) {
    const { updateIsReconnectionPaused } = this.props;
    // unpause reconnection
    updateIsReconnectionPaused(false);
    this.setState({ showEnvForm: false });
  }

  updateField(field, value) {
    this.setState({ [field]: value });
  }

  render() {
    const { modal } = this.props;
    const { showEnvForm } = this.state;
    const connectionStatus = getValue(this.props, "modal.connection");
    let nodeTitleText = "";
    let nodeDescriptionText = "";
    if (
      connectionStatus.isConnected &&
      !connectionStatus.isConnectedToAugurNode
    ) {
      // augurNode disconnected only
      nodeTitleText = " to Augur Node";
      nodeDescriptionText = " from your Augur Node";
    }
    if (
      !connectionStatus.isConnected &&
      connectionStatus.isConnectedToAugurNode
    ) {
      // ethereumNode disconnected only
      nodeTitleText = " to Ethereum Node";
      nodeDescriptionText = " from your Ethereum Node";
    }
    // assemble the text based on disconnections
    const titleText = `Reconnecting${nodeTitleText}`;
    const descriptionText = `Please wait while we try to reconnect you, or update your node addresses `;

    return (
      <section className={commonStyles.ModalContainer}>
        {!showEnvForm && <h1>{titleText}</h1>}
        {!showEnvForm && (
          <p>
            {`You have been disconnected${nodeDescriptionText}.`}
            <br />
            {descriptionText}
            <button onClick={this.showForm}>here</button>.
          </p>
        )}
        {!showEnvForm && <ModalLoading />}
        {showEnvForm && (
          <ModalNetworkConnect submitForm={this.submitForm} env={modal.env} />
        )}
      </section>
    );
  }
}
