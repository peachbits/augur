
from eth_tester.exceptions import TransactionFailed
from utils import longToHexString, stringToBytes
from pytest import fixture, raises, mark

# from ethereum.slogging import set_level
# set_level('eth.vm.exit', 'TRACE')


@mark.skip
def test_universe_creation(localFixture, mockReputationToken, mockReputationTokenFactory, mockUniverse, mockUniverseFactory, mockAugur):
    mockReputationTokenFactory.set_mock_createReputationToken_0_address_address_address(mockReputationToken.address)

    universe = localFixture.upload('../source/contracts/reporting/Universe.sol', 'newUniverse', constructorArgs=[localFixture.contracts['Augur'].address, mockUniverse.address, stringToBytes("5")])

    assert universe.getReputationToken() == mockReputationToken.address
    assert universe.getParentUniverse() == mockUniverse.address
    assert universe.getParentPayoutDistributionHash() == stringToBytes("5")
    assert universe.getForkingMarket() == longToHexString(0)
    assert universe.getForkEndTime() == 0
    assert universe.getTypeName() == stringToBytes('Universe')
    assert universe.getForkEndTime() == 0
    assert universe.getChildUniverse("5") == longToHexString(0)

@mark.skip
def test_universe_fork_market(localFixture, populatedUniverse, mockUniverse, mockDisputeWindow, mockUniverseFactory, mockDisputeWindowFactory, mockMarket, chain, mockMarketFactory, mockAugur):
    with raises(TransactionFailed):
        populatedUniverse.fork()

    timestamp = localFixture.contracts["Time"].getTimestamp()

    mockDisputeWindowFactory.set_mock_createDisputeWindow_0_address_address_uint256 (mockDisputeWindow.address)
    mockMarketFactory.set_mock_createMarket__market_address_address_uint256_uint256_address_address_uint256_uint256(mockMarket.address)
    endTime = localFixture.contracts["Time"].getTimestamp() + 30 * 24 * 60 * 60 # 30 days

    with raises(TransactionFailed):
        mockMarket.callForkOnUniverse(populatedUniverse.address)

    assert populatedUniverse.createYesNoMarket(endTime, 1000, 0, fixture.accounts[0], "topic", "description", "info")
    assert mockMarketFactory.getCreateMarketUniverseValue() == populatedUniverse.address

    assert populatedUniverse.isContainerForMarket(mockMarket.address)

    assert populatedUniverse.getForkingMarket() == longToHexString(0)

    assert mockMarket.callForkOnUniverse(populatedUniverse.address)
    assert mockAugur.logUniverseForkedCalled() == True
    assert populatedUniverse.getForkingMarket() == mockMarket.address
    assert populatedUniverse.getForkEndTime() == timestamp + localFixture.contracts['Constants'].FORK_DURATION_SECONDS()

@mark.skip
def test_get_reporting_window(localFixture, populatedUniverse, chain):
    constants = localFixture.contracts['Constants']
    timestamp = localFixture.contracts["Time"].getTimestamp()
    duration =  constants.DISPUTE_ROUND_DURATION_SECONDS()
    reportingPeriodDurationForTimestamp = timestamp / duration

    assert populatedUniverse.getDisputeWindowId(timestamp) == reportingPeriodDurationForTimestamp
    assert populatedUniverse.getDisputeRoundDurationInSeconds() == duration

    # dispute window not stored internally, only read-only method
    assert populatedUniverse.getDisputeWindow(reportingPeriodDurationForTimestamp) == longToHexString(0)
    report_window = populatedUniverse.getOrCreateDisputeWindowByTimestamp(timestamp)

    # Now dispute window is in internal collection
    assert populatedUniverse.getDisputeWindow(reportingPeriodDurationForTimestamp) == report_window

    # Make up end timestamp for testing internal calculations
    end_timestamp = localFixture.contracts["Time"].getTimestamp() + 1

    # Test getting same calculated end dispute window
    assert populatedUniverse.getOrCreatePreviousDisputeWindow() == populatedUniverse.getOrCreateDisputeWindowByTimestamp(chain.head_state.timestamp - duration)
    assert populatedUniverse.getOrCreateCurrentDisputeWindow(False) == populatedUniverse.getOrCreateDisputeWindowByTimestamp(chain.head_state.timestamp)
    assert populatedUniverse.getOrCreateNextDisputeWindow() == populatedUniverse.getOrCreateDisputeWindowByTimestamp(chain.head_state.timestamp + duration)

@mark.skip
def test_universe_contains(localFixture, populatedUniverse, mockMarket, chain, mockMarketFactory, mockDisputeWindow, mockShareToken, mockDisputeWindowFactory):
    mockDisputeWindow.setStartTime(0)
    assert populatedUniverse.isContainerForDisputeWindow(mockDisputeWindow.address) == False
    assert populatedUniverse.isContainerForMarket(mockMarket.address) == False
    assert populatedUniverse.isContainerForShareToken(mockShareToken.address) == False

    timestamp = localFixture.contracts["Time"].getTimestamp()
    mockDisputeWindowFactory.setCreateDisputeWindowValue(mockDisputeWindow.address)
    disputeWindowId = populatedUniverse.getOrCreateDisputeWindowByTimestamp(timestamp)
    mockDisputeWindow.setStartTime(timestamp)

    mockMarket.setIsContainerForShareToken(False)

    assert populatedUniverse.isContainerForMarket(mockMarket.address) == False
    assert populatedUniverse.isContainerForShareToken(mockShareToken.address) == False

    mockMarket.setIsContainerForShareToken(True)
    mockMarket.setDisputeWindow(mockDisputeWindow.address)
    mockShareToken.setMarket(mockMarket.address)

    mockMarketFactory.setMarket(mockMarket.address)
    endTime = localFixture.contracts["Time"].getTimestamp() + 30 * 24 * 60 * 60 # 30 days

    assert populatedUniverse.createYesNoMarket(endTime, 1000, 0, fixture.accounts[0], "topic", "description", "info")
    assert mockMarketFactory.getCreateMarketUniverseValue() == populatedUniverse.address

    assert populatedUniverse.isContainerForDisputeWindow(mockDisputeWindow.address) == True
    assert populatedUniverse.isContainerForMarket(mockMarket.address) == True
    assert populatedUniverse.isContainerForShareToken(mockShareToken.address) == True

@mark.skip
def test_open_interest(localFixture, populatedUniverse):
    multiplier = localFixture.contracts['Constants'].TARGET_REP_MARKET_CAP_MULTIPLIER() / float(localFixture.contracts['Constants'].TARGET_REP_MARKET_CAP_DIVISOR())
    assert populatedUniverse.getTargetRepMarketCapInAttoCash() == 0
    assert populatedUniverse.getOpenInterestInAttoCash() == 0
    populatedUniverse.incrementOpenInterest(20)
    assert populatedUniverse.getTargetRepMarketCapInAttoCash() == 20 * multiplier
    assert populatedUniverse.getOpenInterestInAttoCash() == 20

@mark.skip
def test_universe_calculate_bonds_stakes(localFixture, chain, populatedUniverse, mockDisputeWindow, mockDisputeWindowFactory):
    timestamp = localFixture.contracts["Time"].getTimestamp()
    constants = localFixture.contracts['Constants']
    currentDisputeWindow = mockDisputeWindow
    nextDisputeWindow = localFixture.upload('solidity_test_helpers/MockDisputeWindow.sol', 'nextDisputeWindow')
    newCurrentDisputeWindow = localFixture.upload('solidity_test_helpers/MockDisputeWindow.sol', 'newCurrentDisputeWindow')
    # set current dispute window
    mockDisputeWindowFactory.setCreateDisputeWindowValue(mockDisputeWindow.address)
    assert populatedUniverse.getOrCreateCurrentDisputeWindow(False) == mockDisputeWindow.address

    # set next dispute window
    mockDisputeWindowFactory.setCreateDisputeWindowValue(nextDisputeWindow.address)
    assert populatedUniverse.getOrCreateNextDisputeWindow() == nextDisputeWindow.address

    initial_report_min = populatedUniverse.getInitialReportMinValue()
    designated_divisor = constants.TARGET_INCORRECT_DESIGNATED_REPORT_MARKETS_DIVISOR()
    designated_default = initial_report_min
    designated_floor = initial_report_min

    validity_divisor = constants.TARGET_INVALID_MARKETS_DIVISOR()
    validity_default = constants.DEFAULT_VALIDITY_BOND()
    validity_floor = constants.VALIDITY_BOND_FLOOR()

    noshow_divisor = constants.TARGET_DESIGNATED_REPORT_NO_SHOWS_DIVISOR()
    noshow_default = initial_report_min
    noshow_floor = initial_report_min


    # current dispute window
    designatedStakeValue = populatedUniverse.calculateFloatingValue(0, 0, designated_divisor, 0, designated_default, designated_floor)
    validityBondValue = populatedUniverse.calculateFloatingValue(0, 0, validity_divisor, 0, validity_default, validity_floor)
    noshowBondValue = populatedUniverse.calculateFloatingValue(0, 0, noshow_divisor, 0, noshow_default, noshow_floor)
    # validity bond is the same if window hasn't changed
    assert populatedUniverse.getOrCacheDesignatedReportStake() == designatedStakeValue
    assert populatedUniverse.getOrCacheDesignatedReportStake() == designatedStakeValue
    assert populatedUniverse.getOrCacheValidityBond() == validityBondValue
    assert populatedUniverse.getOrCacheValidityBond() == validityBondValue
    assert populatedUniverse.getOrCacheDesignatedReportNoShowBond() == noshowBondValue
    assert populatedUniverse.getOrCacheDesignatedReportNoShowBond() == noshowBondValue

    # push dispute window forward
    localFixture.contracts["Time"].incrementTimestamp(populatedUniverse.getDisputeRoundDurationInSeconds())
    assert populatedUniverse.getOrCreatePreviousDisputeWindow() == currentDisputeWindow.address

    localFixture.contracts["Time"].incrementTimestamp(populatedUniverse.getDisputeRoundDurationInSeconds())
    assert populatedUniverse.getOrCreatePreviousPreviousDisputeWindow() == currentDisputeWindow.address

    numMarket = 6
    currentDisputeWindow.setNumMarkets(numMarket)
    currentDisputeWindow.setNumIncorrectDesignatedReportMarkets(5)
    currentDisputeWindow.setNumInvalidMarkets(2)
    currentDisputeWindow.setNumDesignatedReportNoShows(3)
    newDesignatedStakeValue = populatedUniverse.calculateFloatingValue(5, numMarket, designated_divisor, designatedStakeValue, designated_default, designated_floor)
    newValidityBondValue = populatedUniverse.calculateFloatingValue(2, numMarket, validity_divisor, validityBondValue, validity_default, validity_floor)
    newNoshowBondValue = populatedUniverse.calculateFloatingValue(3, numMarket, noshow_divisor, noshowBondValue, noshow_default, noshow_floor)

    assert populatedUniverse.getOrCacheDesignatedReportStake() == newDesignatedStakeValue
    assert populatedUniverse.getOrCacheValidityBond() == newValidityBondValue
    assert populatedUniverse.getOrCacheDesignatedReportNoShowBond() == newNoshowBondValue

    assert populatedUniverse.getOrCacheMarketCreationCost() == newValidityBondValue

@mark.skip
def test_universe_calculate_floating_value_defaults(populatedUniverse):
    defaultValue = 12
    totalMarkets = 0
    assert populatedUniverse.calculateFloatingValue(11, totalMarkets, 4, 22, defaultValue, 6) == defaultValue

@mark.skip
def test_universe_create_market(localFixture, chain, populatedUniverse, mockMarket, mockMarketFactory, mockReputationToken, mockAugur, mockDisputeWindowFactory, mockDisputeWindow):
    timestamp = localFixture.contracts["Time"].getTimestamp()
    endTimeValue = timestamp + 10
    feePerEthInWeiValue = 10 ** 18
    affiliateFeeDivisor = 100
    designatedReporterAddressValue = fixture.accounts[2]
    mockDisputeWindow.setCreateMarket(mockMarket.address)

    # set current dispute window
    mockDisputeWindowFactory.setCreateDisputeWindowValue(mockDisputeWindow.address)
    assert populatedUniverse.getOrCreateCurrentDisputeWindow(False) == mockDisputeWindow.address

    # set previous dispute window
    mockDisputeWindowFactory.setCreateDisputeWindowValue(mockDisputeWindow.address)
    assert populatedUniverse.getOrCreatePreviousDisputeWindow() == mockDisputeWindow.address

    assert mockAugur.logMarketCreatedCalled() == False
    mockMarketFactory.setMarket(mockMarket.address)

    newMarket = populatedUniverse.createYesNoMarket(endTimeValue, feePerEthInWeiValue, affiliateFeeDivisor, designatedReporterAddressValue, "topic", "description", "info")

    assert mockMarketFactory.getCreateMarketUniverseValue() == populatedUniverse.address
    assert populatedUniverse.isContainerForMarket(mockMarket.address)
    assert mockAugur.logMarketCreatedCalled() == True
    assert newMarket == mockMarket.address

@fixture(scope="module")
def localSnapshot(fixture, augurInitializedWithMocksSnapshot):
    fixture.resetToSnapshot(augurInitializedWithMocksSnapshot)
    augur = fixture.contracts['Augur']
    # TODO registering these mock contracts fails because the real contracts are already registered
    #      but *not* registering the real contracts causes all other tests to fail
    mockReputationTokenFactory = fixture.contracts['MockReputationTokenFactory']
    mockDisputeWindowFactory = fixture.contracts['MockDisputeWindowFactory']
    mockMarketFactory = fixture.contracts['MockMarketFactory']
    mockUniverseFactory = fixture.contracts['MockUniverseFactory']
    augur.registerContract(stringToBytes('MarketFactory'), mockMarketFactory.address)
    augur.registerContract(stringToBytes('ReputationTokenFactory'), mockReputationTokenFactory.address)
    augur.registerContract(stringToBytes('DisputeWindowFactory'), mockDisputeWindowFactory.address)
    augur.registerContract(stringToBytes('UniverseFactory'), mockUniverseFactory.address)

    mockReputationToken = fixture.contracts['MockReputationToken']
    mockUniverse = fixture.contracts['MockUniverse']
    mockReputationTokenFactory.set_mock_createReputationToken_0_address_address_address(mockReputationToken.address)

    universe = fixture.upload('../source/contracts/reporting/Universe.sol', 'universe', constructorArgs=[fixture.contracts['Augur'].address, mockUniverse.address, stringToBytes("5")])
    fixture.contracts['populatedUniverse'] = universe

    return fixture.createSnapshot()

@fixture
def localFixture(fixture, localSnapshot):
    fixture.resetToSnapshot(localSnapshot)
    return fixture

@fixture
def chain(localFixture):
    return localFixture.chain

@fixture
def mockDisputeWindow(localFixture):
    return localFixture.contracts['MockDisputeWindow']

@fixture
def mockReputationToken(localFixture):
    return localFixture.contracts['MockReputationToken']

@fixture
def mockReputationTokenFactory(localFixture):
    return localFixture.contracts['MockReputationTokenFactory']

@fixture
def mockDisputeWindowFactory(localFixture):
    return localFixture.contracts['MockDisputeWindowFactory']

@fixture
def mockUniverseFactory(localFixture):
    return localFixture.contracts['MockUniverseFactory']

@fixture
def mockMarketFactory(localFixture):
    return localFixture.contracts['MockMarketFactory']

@fixture
def mockUniverse(localFixture):
    return localFixture.contracts['MockUniverse']

@fixture
def mockMarket(localFixture):
    return localFixture.contracts['MockMarket']

@fixture
def mockAugur(localFixture):
    return localFixture.contracts['MockAugur']

@fixture
def mockShareToken(localFixture):
    return localFixture.contracts['MockShareToken']

@fixture
def populatedUniverse(localFixture, mockReputationTokenFactory, mockReputationToken, mockUniverse):
    return localFixture.contracts['populatedUniverse']
