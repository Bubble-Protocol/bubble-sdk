// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/**
 * Contract defining GDPR roles, and modifiers for use with those roles. Each role is a single 
 * account address.
 */
abstract contract GDPRRoles {

    // GDPR role accounts
    address private controller;
    address private processor;
    address private subject;

    /**
     * @dev Modifier to restrict access to the controller, processor and subject.
     */
    modifier onlyStakeholders() {
        require(msg.sender == controller || msg.sender == processor || msg.sender == subject, "permission denied");
        _;
    }

    /**
     * @dev Modifier to restrict access to the controller or processor.
     */
    modifier onlyControllerOrProcessor() {
        require(msg.sender == controller || msg.sender == processor, "permission denied");
        _;
    }

    /**
     * @dev Modifier to restrict access to the subject.
     */
    modifier onlySubject() {
        require(msg.sender == subject, "permission denied");
        _;
    }

    /**
     * @dev Modifier to restrict access to the controller.
     */
    modifier onlyController() {
        require(msg.sender == controller, "permission denied");
        _;
    }

    /**
     * @dev Modifier to restrict access to the processor.
     */
    modifier onlyProcessor() {
        require(msg.sender == processor, "permission denied");
        _;
    }

    /**
     * @dev Constructor that initialises the subject, controller and processor.
     */
    constructor(address _subject, address _controller, address _processor) {
        subject = _subject;
        controller = _controller;
        processor = _processor;
    }

    /**
     * @dev Retrieve the controller address.
     */
    function getController() public view onlyStakeholders returns (address) {
        return controller;
    }

    /**
     * @dev Retrieve the processor address.
     */
    function getProcessor() public view onlyStakeholders returns (address) {
        return processor;
    }

    /**
     * @dev Retrieve the subject address.
     */
    function getSubject() public view onlyStakeholders returns (address) {
        return subject;
    }

    /**
     * @dev Transfer the controller role to a new address. Only the current controller can do this.
     */
    function transferController(address _newController) public onlyController {
        controller = _newController;
    }

    /**
     * @dev Transfer the processor role to a new address. Only the controller or current processor 
     * can do this.
     */
    function transferProcessor(address _newProcessor) public onlyControllerOrProcessor {
        processor = _newProcessor;
    }

    /**
     * @dev Transfer the subject role to a new address. Only the current subject can do this.
     */
    function transferSubject(address _newSubject) public onlySubject {
        _transferSubject(_newSubject);
    }

    /**
     * @dev Internal function to transfer the subject role to a new address should the inheriting
     * contract need to override the default behaviour.
     */
    function _transferSubject(address _newSubject) internal {
        subject = _newSubject;
    }

}
