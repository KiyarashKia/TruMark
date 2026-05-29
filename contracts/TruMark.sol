// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TruMark
 * @notice A single registry of food products, keyed by UPC/barcode.
 *
 * The previous version deployed one contract per product, which made consumer
 * lookups impossible (no index) and cost a full deployment per item. This is one
 * long-lived contract: producers register a product against its barcode, and
 * the consumer app reads it back by the same barcode.
 *
 * Writes are owner-gated; reads are public and free.
 */
contract TruMark {
    struct Product {
        string role; // who registered (farmer, processor, ...)
        string upc; // barcode
        string lot; // lot / batch number
        string productType; // category or standard
        string date; // production date (ISO string)
        string creator; // signature / responsible party
        address registeredBy;
        uint256 timestamp; // block time of registration
        bool exists;
    }

    address public owner;

    // upc => product record
    mapping(string => Product) private products;
    // All registered UPCs, for enumeration / off-chain indexing.
    string[] private upcs;

    event ProductRegistered(
        string indexed upc,
        string role,
        string creator,
        address indexed registeredBy,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "TruMark: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Register (or overwrite) a product against its barcode.
     * @dev Overwriting keeps the original `timestamp`/`registeredBy` slot fresh;
     *      historical edits remain auditable via emitted events on-chain.
     */
    function registerProduct(
        string calldata upc,
        string calldata role,
        string calldata lot,
        string calldata productType,
        string calldata date,
        string calldata creator
    ) external onlyOwner {
        require(bytes(upc).length > 0, "TruMark: empty upc");

        if (!products[upc].exists) {
            upcs.push(upc);
        }

        products[upc] = Product({
            role: role,
            upc: upc,
            lot: lot,
            productType: productType,
            date: date,
            creator: creator,
            registeredBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit ProductRegistered(upc, role, creator, msg.sender, block.timestamp);
    }

    /// @notice Read a product by barcode. Reverts if it was never registered.
    function getProduct(string calldata upc) external view returns (Product memory) {
        require(products[upc].exists, "TruMark: not found");
        return products[upc];
    }

    /// @notice Cheap existence check the consumer app can call before reading.
    function isRegistered(string calldata upc) external view returns (bool) {
        return products[upc].exists;
    }

    /// @notice Total number of registered products.
    function totalProducts() external view returns (uint256) {
        return upcs.length;
    }

    /// @notice Enumerate registered UPCs (for off-chain indexers).
    function upcAt(uint256 index) external view returns (string memory) {
        require(index < upcs.length, "TruMark: index out of range");
        return upcs[index];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TruMark: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
