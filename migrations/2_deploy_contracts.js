var FundingHub = artifacts.require("FundingHub.sol");

module.exports = function(deployer) {
	deployer.deploy(FundingHub).then(function() {

		web3.eth.getAccounts(function(err, accs) {
			
			coinbase = accs[0];

			FundingHub.deployed().then(function(instance) {
				instance.createProject("Test project", 1000000000000000000, 657110700, {from: coinbase, gas: 1000000});
			});

		});
		
	});
};