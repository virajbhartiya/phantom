// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {PhantomToken} from "../src/PhantomToken.sol";
import {StakingContract} from "../src/StakingContract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PhantomToken token = new PhantomToken(
            "Phantom Token",
            "PHTM",
            18,
            1_000_000 * 10 ** 18
        );

        StakingContract stakingContract = new StakingContract(address(token));

        vm.stopBroadcast();

        console2.log("Token deployed at: ", address(token));
        console2.log(
            "Staking contract deployed at: ",
            address(stakingContract)
        );
    }
}
