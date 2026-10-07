// SPDX-License-Identifier: MIT
pragma solidity ^0.8.37;

contract DurianTraceability {
    address public owner;
    
    mapping(address => bool) public producers;
    mapping(address => bool) public transporters;
    mapping(address => bool) public retailers;

    enum Stage { Created, FarmHarvested, Packed, InTransit, Delivered, CounterfeitReported }

    struct SupplyInfo {
        string batchId;
        string productName;
        string farmLocation;
        uint256 harvestDate;
        string metadataHash;
        Stage currentStage;
        address currentHolder;
        bool isAuthentic;
    }

    mapping(string => SupplyInfo) public stamps;
    
    struct HistoryLog {
        Stage stage;
        address updater;
        string location;
        uint256 timestamp;
        string note;
    }
    mapping(string => HistoryLog[]) public stampHistories;

    event StampCreated(string indexed stampId, string batchId, string productName);
    event StageUpdated(string indexed stampId, Stage stage, address indexed updater, string location);
    event CounterfeitDetected(string indexed stampId, address reporter);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyProducer() {
        require(producers[msg.sender] || msg.sender == owner, "Not authorized producer");
        _;
    }

    modifier onlyAuthorized() {
        require(producers[msg.sender] || transporters[msg.sender] || retailers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        producers[msg.sender] = true;
    }

    function setProducer(address account, bool status) external onlyOwner {
        producers[account] = status;
    }

    function setTransporter(address account, bool status) external onlyOwner {
        transporters[account] = status;
    }

    function setRetailer(address account, bool status) external onlyOwner {
        retailers[account] = status;
    }

    function createStamp(
        string memory stampId,
        string memory batchId,
        string memory productName,
        string memory farmLocation,
        uint256 harvestDate,
        string memory metadataHash
    ) external onlyProducer {
        require(bytes(stamps[stampId].batchId).length == 0, "Stamp already exists");

        stamps[stampId] = SupplyInfo({
            batchId: batchId,
            productName: productName,
            farmLocation: farmLocation,
            harvestDate: harvestDate,
            metadataHash: metadataHash,
            currentStage: Stage.FarmHarvested,
            currentHolder: msg.sender,
            isAuthentic: true
        });

        stampHistories[stampId].push(HistoryLog({
            stage: Stage.FarmHarvested,
            updater: msg.sender,
            location: farmLocation,
            timestamp: block.timestamp,
            note: "Thu hoach tai nong trai va khoi tao tem chong gia"
        }));

        emit StampCreated(stampId, batchId, productName);
    }

    function updateStage(
        string memory stampId,
        Stage newStage,
        string memory location,
        string memory note
    ) external onlyAuthorized {
        SupplyInfo storage info = stamps[stampId];
        require(info.isAuthentic, "Stamp is invalid or reported counterfeit");
        require(bytes(info.batchId).length > 0, "Stamp does not exist");

        info.currentStage = newStage;
        info.currentHolder = msg.sender;

        stampHistories[stampId].push(HistoryLog({
            stage: newStage,
            updater: msg.sender,
            location: location,
            timestamp: block.timestamp,
            note: note
        }));

        emit StageUpdated(stampId, newStage, msg.sender, location);
    }

    function reportCounterfeit(string memory stampId) external {
        SupplyInfo storage info = stamps[stampId];
        require(bytes(info.batchId).length > 0, "Stamp does not exist");
        
        info.isAuthentic = false;
        info.currentStage = Stage.CounterfeitReported;

        emit CounterfeitDetected(stampId, msg.sender);
    }

    function getStampDetails(string memory stampId) external view returns (
        string memory batchId,
        string memory productName,
        string memory farmLocation,
        uint256 harvestDate,
        string memory metadataHash,
        Stage currentStage,
        bool isAuthentic
    ) {
        SupplyInfo memory info = stamps[stampId];
        require(bytes(info.batchId).length > 0, "Stamp does not exist");
        return (
            info.batchId,
            info.productName,
            info.farmLocation,
            info.harvestDate,
            info.metadataHash,
            info.currentStage,
            info.isAuthentic
        );
    }

    function getHistory(string memory stampId) external view returns (HistoryLog[] memory) {
        return stampHistories[stampId];
    }
}