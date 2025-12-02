// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {GachaGame} from "../src/GachaGame.sol";

/// @notice Deploy script for GachaGame.
/// @dev Configure env vars before running:
/// - PRIVATE_KEY: deployer private key
/// - GACHA_TICKET_PRICE: initial ticket price in wei
contract GachaGameScript is Script {
    function run() external {
        // Use bytes32 to allow both hex and decimal env formats for the private key.
        uint256 deployerKey = uint256(vm.envBytes32("PRIVATE_KEY"));
        uint256 ticketPrice = vm.envUint("GACHA_TICKET_PRICE");

        vm.startBroadcast(deployerKey);
        new GachaGame(ticketPrice);
        vm.stopBroadcast();
    }
}
