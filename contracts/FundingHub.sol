pragma solidity ^0.4.6;

import "./Project.sol";

contract FundingHub {

	address public owner;
	address[] public projectAddresses;

	modifier onlyOwner() { if (msg.sender != owner) throw; _; }
	
	function FundingHub() {
		owner = msg.sender;
		//Temporary fix. Can't delete the key 0 in array, so we're not using it.
		projectAddresses.push(0x0);
	}

	function createProject(string name, uint248 amountToRaise, uint248 deadline) returns (address) {
		address newProject = new Project(name, amountToRaise, deadline);
		projectAddresses.push(newProject);
		return newProject;
	}

	function contribute(address projectAddress) payable returns (bool successful) {
		Project project = Project(projectAddress);
		return project.fund.value(msg.value).gas(150000)();
	}

	function getProjectAddress(uint i) constant returns (address projectAddress) {
		return projectAddresses[i];
	}

	function getAddressesLength() constant returns (uint length) {
		//-1 because we're not using position 0.
		return projectAddresses.length - 1;
	}

	function killMe() onlyOwner returns (bool successful) {
		suicide(owner);
		return true;
	}
}