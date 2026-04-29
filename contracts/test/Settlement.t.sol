pragma solidity ^0.8.20;

import {Test, Vm} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {MockToken} from "../src/MockToken.sol";
import {Settlement} from "../src/Settlement.sol";
import {TradeParams, AgentFill} from "../src/types/SettlementTypes.sol";
import {Permit2} from "permit2/src/Permit2.sol";
import {ISignatureTransfer} from "permit2/src/interfaces/ISignatureTransfer.sol";

/**
 * @title SettlementTest
 * @notice Tests for atomic trade settlement with Permit2 signatures
 */
contract SettlementTest is Test {
    MockToken public wbtc;
    MockToken public usdt;
    Permit2 public permit2;
    Settlement public settlement;

    uint256 public userPrivateKey;
    uint256 public agent1PrivateKey;
    uint256 public agent2PrivateKey;
    
    address public user;
    address public agent1;
    address public agent2;

    uint8 constant DECIMALS = 6;

    function setUp() public {
        permit2 = new Permit2();
        settlement = new Settlement(address(permit2));
        
        wbtc = new MockToken("Wrapped Bitcoin", "WBTC", DECIMALS);
        usdt = new MockToken("Tether USD", "USDT", DECIMALS);

        userPrivateKey = 0xA11CE;
        agent1PrivateKey = 0xB0B;
        agent2PrivateKey = 0xCAFE;
        
        user = vm.addr(userPrivateKey);
        agent1 = vm.addr(agent1PrivateKey);
        agent2 = vm.addr(agent2PrivateKey);

        wbtc.mint(agent1, 1_000_000);
        wbtc.mint(agent2, 2_000_000);
        usdt.mint(user, 64_000_000_000);
    }

    function testPermit2SignatureTrade() public {
        uint256 btcAmount = 200_000;
        uint256 usdtAmount = 12_800_000_000;
        uint256 deadline = block.timestamp + 1 hours;

        uint256 userUsdtBefore = usdt.balanceOf(user);
        uint256 agent1BtcBefore = wbtc.balanceOf(agent1);

        vm.prank(user);
        usdt.approve(address(permit2), usdtAmount);
        vm.prank(agent1);
        wbtc.approve(address(permit2), btcAmount);

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)"),
                keccak256("Permit2"),
                block.chainid,
                address(permit2)
            )
        );

        bytes32 userStructHash = keccak256(abi.encode(
            keccak256("PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"),
            keccak256(abi.encode(keccak256("TokenPermissions(address token,uint256 amount)"), address(usdt), usdtAmount)),
            address(settlement), uint256(0), deadline
        ));
        bytes32 userDigest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, userStructHash));
        (uint8 userV, bytes32 userR, bytes32 userS) = vm.sign(userPrivateKey, userDigest);
        bytes memory userSig = abi.encodePacked(userR, userS, userV);

        bytes32 agentStructHash = keccak256(abi.encode(
            keccak256("PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"),
            keccak256(abi.encode(keccak256("TokenPermissions(address token,uint256 amount)"), address(wbtc), btcAmount)),
            address(settlement), uint256(0), deadline
        ));
        bytes32 agentDigest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, agentStructHash));
        (uint8 agentV, bytes32 agentR, bytes32 agentS) = vm.sign(agent1PrivateKey, agentDigest);
        bytes memory agentSig = abi.encodePacked(agentR, agentS, agentV);

        AgentFill[] memory fills = new AgentFill[](1);
        fills[0] = AgentFill({agent: agent1, agentNonce: 0, baseAmount: btcAmount, quoteAmount: usdtAmount, agentSignature: agentSig});

        TradeParams memory params = TradeParams({
            user: user, baseToken: address(wbtc), quoteToken: address(usdt), isBuy: true,
            minBaseAmount: btcAmount - 1000, maxBaseAmount: btcAmount + 1000, deadline: deadline,
            userNonce: 0, userSignature: userSig, fills: fills
        });

        settlement.settleTrade(params);

        assertEq(usdt.balanceOf(user), userUsdtBefore - usdtAmount, "User USDT deducted");
        assertEq(wbtc.balanceOf(agent1), agent1BtcBefore - btcAmount, "Agent BTC deducted");
        assertEq(wbtc.balanceOf(user), btcAmount, "User received BTC");
    }

    function testPermit2SignatureSell() public {
        wbtc.mint(user, 200_000);
        usdt.mint(agent1, 12_800_000_000);

        uint256 btcAmount = 200_000;
        uint256 usdtAmount = 12_800_000_000;
        uint256 deadline = block.timestamp + 1 hours;

        uint256 userBtcBefore = wbtc.balanceOf(user);
        uint256 agent1UsdtBefore = usdt.balanceOf(agent1);

        vm.prank(user);
        wbtc.approve(address(permit2), btcAmount);
        vm.prank(agent1);
        usdt.approve(address(permit2), usdtAmount);

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)"),
                keccak256("Permit2"),
                block.chainid,
                address(permit2)
            )
        );

        bytes32 userStructHash = keccak256(abi.encode(
            keccak256("PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"),
            keccak256(abi.encode(keccak256("TokenPermissions(address token,uint256 amount)"), address(wbtc), btcAmount)),
            address(settlement), uint256(1), deadline
        ));
        bytes32 userDigest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, userStructHash));
        (uint8 userV, bytes32 userR, bytes32 userS) = vm.sign(userPrivateKey, userDigest);
        bytes memory userSig = abi.encodePacked(userR, userS, userV);

        bytes32 agentStructHash = keccak256(abi.encode(
            keccak256("PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"),
            keccak256(abi.encode(keccak256("TokenPermissions(address token,uint256 amount)"), address(usdt), usdtAmount)),
            address(settlement), uint256(1), deadline
        ));
        bytes32 agentDigest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, agentStructHash));
        (uint8 agentV, bytes32 agentR, bytes32 agentS) = vm.sign(agent1PrivateKey, agentDigest);
        bytes memory agentSig = abi.encodePacked(agentR, agentS, agentV);

        AgentFill[] memory fills = new AgentFill[](1);
        fills[0] = AgentFill({agent: agent1, agentNonce: 1, baseAmount: btcAmount, quoteAmount: usdtAmount, agentSignature: agentSig});

        TradeParams memory params = TradeParams({
            user: user, baseToken: address(wbtc), quoteToken: address(usdt), isBuy: false,
            minBaseAmount: btcAmount - 1000, maxBaseAmount: btcAmount + 1000, deadline: deadline,
            userNonce: 1, userSignature: userSig, fills: fills
        });

        settlement.settleTrade(params);

        assertEq(wbtc.balanceOf(user), userBtcBefore - btcAmount, "User BTC deducted");
        assertEq(usdt.balanceOf(agent1), agent1UsdtBefore - usdtAmount, "Agent USDT deducted");
        assertEq(usdt.balanceOf(user), 64_000_000_000 + usdtAmount, "User received USDT");
    }

    function testTokenDecimals() public view {
        assertEq(wbtc.decimals(), 6, "WBTC has 6 decimals");
        assertEq(usdt.decimals(), 6, "USDT has 6 decimals");
    }

    function testSettlementConfig() public view {
        assertTrue(address(settlement) != address(0), "Settlement deployed");
        assertTrue(address(permit2) != address(0), "Permit2 deployed");
    }
}
