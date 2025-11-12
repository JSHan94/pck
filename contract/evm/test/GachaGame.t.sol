// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {GachaGame} from "../src/GachaGame.sol";

contract GachaGameTest is Test {
    GachaGame private game;

    function setUp() public {
        game = new GachaGame(0); // ticket price 0 for tests
    }

    function testOwnerIsDeployer() public {
        assertEq(game.owner(), address(this), "owner mismatch");
    }

    function testBuyTicketStoresRoot() public {
        bytes32 root = keccak256("root");
        game.buyTicket(root, 1);
        assertEq(game.gameMerkleRoot(1), root, "root not stored");
    }

    function testClaimPrizeMarksPrizeAsClaimedAndMints() public {
        // Create two leaves to form a tree
        bytes32 leafA = keccak256(abi.encodePacked(uint8(0), uint8(1), bytes32(uint256(1))));
        bytes32 leafB = keccak256(abi.encodePacked(uint8(1), uint8(2), bytes32(uint256(2))));
        bytes32 root = _hashPair(leafA, leafB);

        game.buyTicket(root, 2);

        bytes32 prizeId = keccak256("prize-1");
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafB;

        game.claimPrize(2, proof, prizeId, 1, 0, bytes32(uint256(1)));

        assertEq(game.isPrizeClaimed(prizeId), true, "prize not flagged");
        assertEq(game.balanceOf(address(this), 1), 1, "token not minted");
    }

    function testClaimPrizeRevertsForInvalidProof() public {
        bytes32 root = keccak256("wrong");
        game.buyTicket(root, 3);

        bytes32[] memory proof = new bytes32[](0);
        bytes32 prizeId = keccak256("bad");

        bool reverted = false;
        try game.claimPrize(3, proof, prizeId, 1, 0, bytes32(uint256(1))) {
            // no-op
        } catch {
            reverted = true;
        }

        assertEq(reverted, true, "claim should revert");
    }

    function _hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        (bytes32 a, bytes32 b) = left <= right ? (left, right) : (right, left);
        return keccak256(abi.encodePacked(a, b));
    }
}
