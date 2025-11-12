// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title GachaGame
/// @notice Minimal ERC1155-style reward contract that mirrors PLAN.md specs without external dependencies.
contract GachaGame {
    /// -----------------------------------------------------------------------
    /// Events
    /// -----------------------------------------------------------------------

    event TicketPurchased(address indexed user, uint256 indexed sessionId, bytes32 merkleRoot);
    event PrizeClaimed(address indexed user, bytes32 indexed prizeId, uint256 prizeTier);
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    /// -----------------------------------------------------------------------
    /// Storage
    /// -----------------------------------------------------------------------

    address public owner;
    uint256 public ticketPrice;

    mapping(uint256 => bytes32) public gameMerkleRoot; // sessionId => root
    mapping(bytes32 => bool) public isPrizeClaimed;    // prizeId => claimed
    mapping(uint256 => mapping(address => uint256)) private _balances; // tier => user => balance

    /// -----------------------------------------------------------------------
    /// Errors
    /// -----------------------------------------------------------------------

    error NotOwner();
    error IncorrectTicketPrice();
    error SessionAlreadyCommitted();
    error InvalidSession();
    error PrizeAlreadyClaimed();
    error InvalidProof();

    /// -----------------------------------------------------------------------
    /// Constructor & modifiers
    /// -----------------------------------------------------------------------

    constructor(uint256 _ticketPrice) {
        owner = msg.sender;
        ticketPrice = _ticketPrice;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// -----------------------------------------------------------------------
    /// Admin functions
    /// -----------------------------------------------------------------------

    function setTicketPrice(uint256 _newPrice) external onlyOwner {
        ticketPrice = _newPrice;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function withdraw(address payable _to) external onlyOwner {
        _to.transfer(address(this).balance);
    }

    /// -----------------------------------------------------------------------
    /// User flows
    /// -----------------------------------------------------------------------

    function buyTicket(bytes32 _merkleRoot, uint256 _sessionId) external payable {
        if (msg.value != ticketPrice) revert IncorrectTicketPrice();
        if (gameMerkleRoot[_sessionId] != bytes32(0)) revert SessionAlreadyCommitted();

        gameMerkleRoot[_sessionId] = _merkleRoot;
        emit TicketPurchased(msg.sender, _sessionId, _merkleRoot);
    }

    function claimPrize(
        uint256 _sessionId,
        bytes32[] calldata _merkleProof,
        bytes32 _prizeId,
        uint256 _prizeTier,
        uint8 _cellId,
        bytes32 _salt
    ) external {
        bytes32 root = gameMerkleRoot[_sessionId];
        if (root == bytes32(0)) revert InvalidSession();
        if (isPrizeClaimed[_prizeId]) revert PrizeAlreadyClaimed();

        bytes32 leaf = _leafHash(_cellId, _prizeTier, _salt);
        if (!_verifyProof(_merkleProof, root, leaf)) revert InvalidProof();

        isPrizeClaimed[_prizeId] = true;
        _mint(msg.sender, _prizeTier, 1);
        emit PrizeClaimed(msg.sender, _prizeId, _prizeTier);
    }

    /// -----------------------------------------------------------------------
    /// Views
    /// -----------------------------------------------------------------------

    function balanceOf(address account, uint256 id) external view returns (uint256) {
        return _balances[id][account];
    }

    /// -----------------------------------------------------------------------
    /// Internal helpers
    /// -----------------------------------------------------------------------

    function _mint(address to, uint256 id, uint256 amount) internal {
        require(to != address(0), "INVALID_TO");
        _balances[id][to] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }

    function _leafHash(uint8 _cellId, uint256 _prizeTier, bytes32 _salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_cellId, uint8(_prizeTier), _salt));
    }

    function _verifyProof(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 sibling = proof[i];
            if (computed <= sibling) {
                computed = keccak256(abi.encodePacked(computed, sibling));
            } else {
                computed = keccak256(abi.encodePacked(sibling, computed));
            }
        }
        return computed == root;
    }
}
