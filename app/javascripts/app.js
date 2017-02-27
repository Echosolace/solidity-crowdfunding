var accounts;
var coinbase;
var hub;
var messages = [];
var projects = [];

function setStatus(message) {
	html = "";
	messages.forEach(function(current) {
		html += "<div>" + current + "</div>";
	});
	if (messages.length > 5) messages.pop();
	html += "<div id='lastmessage'>" + message + "</div>";
	messages.push(message);
	document.getElementById('status').innerHTML = html;
}

//From B9lab courseware
function getTransactionReceiptMined(txnHash, interval) {
	var transactionReceiptAsync;
	interval |= 500;
	transactionReceiptAsync = function(txnHash, resolve, reject) {
		try {
			var receipt = web3.eth.getTransactionReceipt(txnHash);
			if (receipt === null) {
				setTimeout(function () {
					transactionReceiptAsync(txnHash, resolve, reject);
				}, interval);
			} else {
				resolve(receipt);
			}
		} catch(e) {
			reject(e);
		}
	};

	return new Promise(function (resolve, reject) {
		transactionReceiptAsync(txnHash, resolve, reject);
	});
}

//Utilities
function readableDate(unixtime) {
	var newDate = new Date();
	newDate.setTime(unixtime*1000);
	return newDate.toUTCString();
}

//Functions for contracts
function createProject(name, amountToRaise, deadline) {
	console.log("Creating project \"" + name + "\"...");
	hub.createProject(name, amountToRaise, deadline, {from: coinbase, gas: 1000000}).then(function(txn) {
		console.log("Project created.")
		location.reload(true);
	})
}

function contribute(address) {
	value = document.getElementById(address).value;
	wei = Math.floor(parseFloat(value.replace(",", "."))*1000000000000000000);
	console.log("Contributing to " + address + " with " + wei + " wei...");
	hub.contribute(address, {from: coinbase, value: wei, gas: 300000}).then(function() {
		location.reload(true);
	});
}

function askRefund(address) {
	project = Project.at(address);
	project.refund({from: coinbase}).then(function(value) {
		console.log(value);
	});
}

function displayProjects() {
	var div = document.getElementById('projects');
	for (var i = 0, len = projects.length; i < len; i++) {
		if (projects[i]["ended"]) {
			endedX = " <span class='ended'>(Ended)</span>";
		} else {
			endedX = "";
		}
		html = "<div class='project'><div><span class='name'>" + projects[i]["name"] + endedX + "</span></div> " +
				"<div><span class='address'>" + projects[i]["address"] + "</span></div>" + 
				"<div><span>Raised " + projects[i]["amountRaised"] + "/" + projects[i]["amountToRaise"] + " Ether.</span></div>" + 
				"<div><span>Deadline: " + readableDate(projects[i]["deadline"]) +
				"</span></div>";
		end = "</div>";
		if (!projects[i]["ended"]) {
			contributeForm = "<form><input id='" + projects[i]["address"] + "' type='text' name='ether'><input type='button' value='Contribute' onclick='contribute(\"" + projects[i]["address"] + "\");' /></form>";
			html = html + contributeForm + end;
		} else if (projects[i]["refund"]) {
			refundForm = "<form><input type='button' value='Refund' onclick='askRefund(\"" + projects[i]["address"] + "\");' /></form>";
			html = html + refundForm + end;
		}
		div.innerHTML += html;
	}
}

function getProjects(start, end) {
	if (start > end) {
		displayProjects();
		return;
	}
	hub.getProjectAddress(start).then(function(value) {
		address = value;
		project = Project.at(address);

		project.getInfo().then(function(value) {
			owner = value[0];
			name = value[1];
			amountToRaise = value[2].valueOf()/1000000000000000000;
			amountToRaise = amountToRaise.toFixed(5)
			deadline = value[3].valueOf();
			project.amountRaised.call().then(function(value) {
				amountRaised = value.valueOf()/1000000000000000000;
				amountRaised = amountRaised.toFixed(5)
				now = Math.floor(Date.now() / 1000);
				ended = false;
				refund = false;
				new Promise(function(fulfill, reject) {
					if (amountRaised >= amountToRaise || now > deadline) {
						project.ended.call().then(function(value) {
							if (value == true) {
								ended = true;
								project.refundEnabled.call().then(function(value) {
									refund = value;
									fulfill();
								});
							} else {
								fulfill();
							}
						});
					} else {
						fulfill();
					}
				}).then(function() {
					var array = {
								address: address,
								owner: owner,
								name: name,
								amountToRaise: amountToRaise,
								deadline: deadline,
								amountRaised: amountRaised,
								ended: ended,
								refund: refund
							}
					projects.push(array);
					getProjects(start+1, end);
				});
			})
			
		});
	});
}

window.onload = function() {

	//Listeners
	$('#addProjectToggle').click(function() {
		$('#addProjectDiv').slideToggle();
	});

	$('#addProjectDeadline').pickadate({
		format: "yyyy/mm/dd"
	});

	$('#addProjectDeadlineTime').pickatime({
		format: "h:i"
	});

	$('#addProjectForm').on('submit', function () {
		var name = $('#addProjectForm').find('input[name="name"]').val();
		var amount = $('#addProjectForm').find('input[name="amount"]').val();
		var deadline = $('#addProjectForm').find('input[name="deadline"]').val();
		var deadlineTime = $('#addProjectForm').find('input[name="deadlineTime"]').val();
		var wei = Math.floor(parseFloat(amount.replace(",", "."))*1000000000000000000);
		var unix = (new Date(deadline + " " + deadlineTime)).getTime() / 1000;
		createProject(name, wei, unix);
		return false;
	});

	FundingHub.deployed().then(function(instance) {

		hub = instance;

		web3.eth.getAccounts(function(err, accs) {
			if (err != null) {
				alert("There was an error fetching your accounts.");
				return;
			}

			if (accs.length == 0) {
				alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
				return;
			}

			accounts = accs;
			coinbase = accounts[0];

			//Getting all projects
			hub.getAddressesLength().then(function(value) {
				addressesLength = value.valueOf();
				if (addressesLength > 0) {
					getProjects(1, addressesLength);
				}
			})

		});

	});
}
