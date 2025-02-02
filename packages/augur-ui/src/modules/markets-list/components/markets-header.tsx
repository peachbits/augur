import React, { Component } from "react";

import FilterSearch from "modules/filter-sort/containers/filter-search";
import FilterDropDowns from "modules/filter-sort/containers/filter-dropdowns";

import parseQuery from "modules/routes/helpers/parse-query";
import parsePath from "modules/routes/helpers/parse-path";

import { MARKETS } from "modules/routes/constants/views";
import { CATEGORY_PARAM_NAME } from "modules/common/constants";

import Styles from "modules/markets-list/components/markets-header.styles.less";

interface MarketsHeaderProps {
  location: object;
  filter: string;
  sort: string;
  maxFee: string;
  hasOrders: boolean;
  updateFilter: Function;
  history: object;
  isSearchingMarkets: boolean;
}

interface MarketsHeaderState {
  headerTitle: string | null;
}

export default class MarketsHeader extends Component<MarketsHeaderProps, MarketsHeaderState> {
  constructor(props) {
    super(props);

    this.state = {
      headerTitle: null,
    };

    this.setHeaderTitle = this.setHeaderTitle.bind(this);
  }

  componentWillMount() {
    const { location } = this.props;
    this.setHeaderTitle(location);
  }

  componentWillReceiveProps(nextProps) {
    const { location } = this.props;
    if (location !== nextProps.location) {
      this.setHeaderTitle(nextProps.location);
    }
  }

  setHeaderTitle(location) {
    const searchParams = parseQuery(location.search);

    if (searchParams[CATEGORY_PARAM_NAME]) {
      this.setState({
        headerTitle: searchParams[CATEGORY_PARAM_NAME]
      });
    } else {
      const path = parsePath(location.pathname);

      if (path[0] === MARKETS) {
        this.setState({
          headerTitle: path[0],
        });
      }
    }
  }

  render() {
    const {
      filter,
      sort,
      maxFee,
      hasOrders,
      updateFilter,
      history,
      isSearchingMarkets,
    } = this.props;
    const { headerTitle } = this.state;

    return (
      <article className={Styles.MarketsHeader}>
        <h1>{headerTitle}</h1>
        <FilterDropDowns
          filter={filter}
          sort={sort}
          maxFee={maxFee}
          hasOrders={hasOrders}
          updateFilter={updateFilter}
          history={history}
          location={location}
        />
        <FilterSearch isSearchingMarkets={isSearchingMarkets} />
      </article>
    );
  }
}
