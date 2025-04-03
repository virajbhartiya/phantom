// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "solmate/tokens/ERC20.sol";
import {Owned} from "solmate/auth/Owned.sol";

contract PhantomToken is ERC20, Owned {
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 initialSupply
    ) ERC20(_name, _symbol, _decimals) Owned(msg.sender) {
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
            emit TokensMinted(msg.sender, initialSupply);
        }
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == from || msg.sender == owner, "Not authorized");
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
}
