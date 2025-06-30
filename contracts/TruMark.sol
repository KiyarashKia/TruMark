// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TruMark
 * @dev Stores simple metadata about a product.
 */
contract TruMark {
    string public name;
    string public product;
    string public creator;
    string public date;

    constructor(
        string memory _name,
        string memory _product,
        string memory _creator,
        string memory _date
    ) {
        name = _name;
        product = _product;
        creator = _creator;
        date = _date;
    }
}
