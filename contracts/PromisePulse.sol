// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PromisePulse {
    uint256 public nextPromiseId = 1;
    uint256 public nextReviewRoundId = 1;

    struct Promise {
        bytes32 promiseHash;
        string category;
        string region;
        string sourceCid;
        uint256 createdAt;
    }

    struct ReviewRound {
        uint256 promiseId;
        string triggerCid;
        uint256 endTime;
        bool isOpen;
    }

    mapping(uint256 => Promise) public promises;
    mapping(uint256 => ReviewRound) public reviewRounds;
    mapping(uint256 => mapping(uint8 => uint256)) public voteCounts; // roundId => option => count
    mapping(uint256 => mapping(address => bool)) public hasVoted; // roundId => voter => voted

    event PromiseRecorded(uint256 indexed promiseId, bytes32 promiseHash, string category, string region, string sourceCid);
    event EvidenceLinked(uint256 indexed promiseId, string evidenceCid, string evidenceType);
    event ReviewRoundOpened(uint256 indexed reviewRoundId, uint256 indexed promiseId, string triggerCid, uint256 endTime);
    event VoteCast(uint256 indexed reviewRoundId, address indexed voter, uint8 voteOption);
    event StatusUpdated(uint256 indexed promiseId, uint8 status);

    // vote options: 0=NOT_VISIBLE, 1=IN_PROGRESS, 2=PARTIALLY_DONE, 3=DONE, 4=NOT_SURE
    uint8 public constant NOT_VISIBLE = 0;
    uint8 public constant IN_PROGRESS = 1;
    uint8 public constant PARTIALLY_DONE = 2;
    uint8 public constant DONE = 3;
    uint8 public constant NOT_SURE = 4;

    function addPromise(
        bytes32 promiseHash,
        string calldata category,
        string calldata region,
        string calldata sourceCid
    ) external returns (uint256) {
        uint256 id = nextPromiseId++;
        promises[id] = Promise({
            promiseHash: promiseHash,
            category: category,
            region: region,
            sourceCid: sourceCid,
            createdAt: block.timestamp
        });
        emit PromiseRecorded(id, promiseHash, category, region, sourceCid);
        return id;
    }

    function addEvidence(
        uint256 promiseId,
        string calldata evidenceCid,
        string calldata evidenceType
    ) external {
        require(promiseId > 0 && promiseId < nextPromiseId, "Invalid promise");
        emit EvidenceLinked(promiseId, evidenceCid, evidenceType);
    }

    function openReviewRound(
        uint256 promiseId,
        string calldata triggerCid,
        uint256 endTime
    ) external returns (uint256) {
        require(promiseId > 0 && promiseId < nextPromiseId, "Invalid promise");
        uint256 id = nextReviewRoundId++;
        reviewRounds[id] = ReviewRound({
            promiseId: promiseId,
            triggerCid: triggerCid,
            endTime: endTime,
            isOpen: true
        });
        emit ReviewRoundOpened(id, promiseId, triggerCid, endTime);
        return id;
    }

    function castVote(uint256 reviewRoundId, uint8 voteOption) external {
        require(reviewRoundId > 0 && reviewRoundId < nextReviewRoundId, "Invalid round");
        ReviewRound storage round = reviewRounds[reviewRoundId];
        require(round.isOpen, "Round closed");
        require(block.timestamp <= round.endTime, "Round expired");
        require(voteOption <= 4, "Invalid vote option");
        require(!hasVoted[reviewRoundId][msg.sender], "Already voted");

        hasVoted[reviewRoundId][msg.sender] = true;
        voteCounts[reviewRoundId][voteOption]++;

        emit VoteCast(reviewRoundId, msg.sender, voteOption);
    }

    function closeRound(uint256 reviewRoundId) external {
        require(reviewRoundId > 0 && reviewRoundId < nextReviewRoundId, "Invalid round");
        reviewRounds[reviewRoundId].isOpen = false;
    }

    function updateStatus(uint256 promiseId, uint8 status) external {
        require(promiseId > 0 && promiseId < nextPromiseId, "Invalid promise");
        require(status >= 0 && status <= 4, "Invalid status");
        emit StatusUpdated(promiseId, status);
    }
}
