pragma solidity ^0.8.20;

import {Test, Vm} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {MockToken} from "../src/MockToken.sol";
import {Settlement} from "../src/Settlement.sol";
import {TradeParams, AgentFill} from "../src/types/SettlementTypes.sol";
import {Permit2} from "permit2/src/Permit2.sol";

/**
 * @title SettlementTest
 * @notice Tests for ERC20 approval based trade settlement
 * @dev Both user and agents use ERC20 approval (no Permit2 signature needed)
 */
contract SettlementTest is Test {
    MockToken public wbtc;
    MockToken public usdt;
    Permit2 public permit2;
    Settlement public settlement;

    address public user;
    address public agent1;

    uint8 constant DECIMALS = 6;

    function setUp() public {
        permit2 = new Permit2();
        settlement = new Settlement(address(permit2));
        
        wbtc = new MockToken("Wrapped Bitcoin", "WBTC", DECIMALS);
        usdt = new MockToken("Tether USD", "USDT", DECIMALS);

        user = makeAddr("user");
        agent1 = makeAddr("agent1");

        // Mint tokens
        wbtc.mint(user, 1_000_000);
        wbtc.mint(agent1, 2_000_000);
        usdt.mint(user, 64_000_000_000);
        usdt.mint(agent1, 12_800_000_000);
    }

    /**
     * @notice Test ERC20 approval trade: User SELL BTC → Agent USDT
     */
    function testERCSell() public {
        uint256 btcAmount = 200_000;
        uint256 usdtAmount = 12_800_000_000;

        uint256 userBtcBefore = wbtc.balanceOf(user);
        uint256 agentUsdtBefore = usdt.balanceOf(agent1);

        // User approves Settlement contract (no Permit2)
        vm.prank(user);
        wbtc.approve(address(settlement), btcAmount);

        // Agent approves Settlement contract (no Permit2)
        vm.prank(agent1);
        usdt.approve(address(settlement), usdtAmount);

        // AgentFill - just agent and amounts
        AgentFill[] memory fills = new AgentFill[](1);
        fills[0] = AgentFill({agent: agent1, baseAmount: btcAmount, quoteAmount: usdtAmount});

        TradeParams memory params = TradeParams({
            user: user, 
            baseToken: address(wbtc), 
            quoteToken: address(usdt), 
            isBuy: false,
            minBaseAmount: btcAmount - 1000, 
            maxBaseAmount: btcAmount + 1000, 
            deadline: block.timestamp + 1 hours,
            userNonce: 0,
            userSignature: "",
            fills: fills
        });

        settlement.settleTrade(params);

        assertEq(wbtc.balanceOf(user), userBtcBefore - btcAmount, "User BTC deducted");
        assertEq(usdt.balanceOf(agent1), agentUsdtBefore - usdtAmount, "Agent USDT deducted");
    }

    /**
     * @notice Test ERC20 approval trade: User BUY BTC ← Agent WBTC
     */
    function testERCBuy() public {
        uint256 btcAmount = 200_000;
        uint256 usdtAmount = 12_800_000_000;

        uint256 userBtcBefore = wbtc.balanceOf(user);
        uint256 userUsdtBefore = usdt.balanceOf(user);
        uint256 agentBtcBefore = wbtc.balanceOf(agent1);

        // User approves Settlement contract
        vm.prank(user);
        usdt.approve(address(settlement), usdtAmount);

        // Agent approves Settlement contract
        vm.prank(agent1);
        wbtc.approve(address(settlement), btcAmount);

        AgentFill[] memory fills = new AgentFill[](1);
        fills[0] = AgentFill({agent: agent1, baseAmount: btcAmount, quoteAmount: usdtAmount});

        TradeParams memory params = TradeParams({
            user: user, 
            baseToken: address(wbtc), 
            quoteToken: address(usdt), 
            isBuy: true,
            minBaseAmount: btcAmount - 1000, 
            maxBaseAmount: btcAmount + 1000, 
            deadline: block.timestamp + 1 hours,
            userNonce: 0,
            userSignature: "",
            fills: fills
        });

        settlement.settleTrade(params);

        assertEq(usdt.balanceOf(user), userUsdtBefore - usdtAmount, "User USDT deducted");
        assertEq(wbtc.balanceOf(agent1), agentBtcBefore - btcAmount, "Agent BTC deducted");
        assertEq(wbtc.balanceOf(user), userBtcBefore + btcAmount, "User received BTC from agent");
    }

    function testTokenDecimals() public view {
        assertEq(wbtc.decimals(), 6);
        assertEq(usdt.decimals(), 6);
    }

    function testSettlementConfig() public view {
        assertTrue(address(settlement) != address(0));
        assertTrue(address(permit2) != address(0));
    }
}