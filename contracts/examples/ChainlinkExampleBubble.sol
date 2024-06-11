// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../AccessControlledStorage.sol";
import "../AccessControlBits.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * An example of using a Chainlink oracle to control access to content.  Public access to a file is  
 * permitted if the current oracle value is above or below an owner set price level.
 */
contract ChainlinkExampleBubble is AccessControlledStorage, Ownable {

    bool terminated = false;
    AggregatorV3Interface internal dataFeed;
    mapping (uint256 => int) filePriceLevels;

    constructor() Ownable(msg.sender) {
        dataFeed = AggregatorV3Interface(0xc907E116054Ad103354f2D350FD2514433D57F6f);  // Polygon BTC/USD price oracle contract
    }

    /**
     * Returns the latest bitcoin price.
     */
    function getCurrentPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }


    /**
     * Allows the owner to configure a file and price level.
     *
     *   If level is 0 then permission is denied
     *   If level is positive then permit public access to file if current price is >= level
     *   If level is negative then permit public access to file if current price is <= -level
     */
    function setPriceLevel(uint fileId, int priceLevel) public onlyOwner {
        filePriceLevels[fileId] = priceLevel;
    }


    /**
     * get the price level for the given file
     */
    function getPriceLevel(uint fileId) public view returns (int) {
        return filePriceLevels[fileId];
    }


    /**
     * The off-chain storage service's Guardian software uses this method to determine the access
     * permissions for a user request.
     */
    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        /**
         * If the bubble has been terminated, the off-chain storage service will delete the bubble and 
         * all its contents.
         */
        if (terminated) return BUBBLE_TERMINATED_BIT;

        /**
         * Owner has full access rights to all files and to the bubble itself
         */
        else if (user == owner()) return RWA_BITS;

        /**
         * Files are public if they have a price level set and the current price is equal to or above it.
         * If the price level is negative then check the current price is equal to or below it.
         */
        else {
            int priceLevel = filePriceLevels[contentId];
            if (priceLevel == 0) return NO_PERMISSIONS;
            if (priceLevel < 0) return getCurrentPrice() <= -priceLevel ? READ_BIT : NO_PERMISSIONS;
            else return getCurrentPrice() >= priceLevel ? READ_BIT : NO_PERMISSIONS;
        }
    }


    /**
     * Terminating the bubble will force the off-chain storage service to delete the bubble and all its
     * contents.  Only the contract owner can terminate the bubble.
     */
    function terminate() external onlyOwner {
        terminated = true;
    }


}
