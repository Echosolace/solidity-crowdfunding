var FundingHub = artifacts.require("FundingHub.sol");
var Project = artifacts.require("Project.sol");

contract('FundingHub', function(accounts) {
	it("should fund the project.", function() {
		amount = 500000000000000000;
		FundingHub.deployed().then(function(instance) {
			instance.getProjectAddress(1).then(function(value) {
				return instance.contribute(value, {value: amount, gas: 300000});
			});
		}).then(function(instance) {
			instance.getProjectAddress(1).then(function(value) {
				project.amountRaised.call().then(function(value) {
					assert.equal(value.valueOf(), amount);
				});
			});
		});
	});
	it("should receive the refund.", function() {
		FundingHub.deployed().then(function(instance) {
			instance.getProjectAddress(1).then(function(value) {
				project = Project.at(value);
				amountBefore = project.contributions(accounts[0]);
				return project.refund();
			});
		}).then(function(project) {
			amountAfter = project.contributions(accounts[0]);
			assert.isTrue(amountBefore > amountAfter);
		});
	});
});