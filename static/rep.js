var REP_NAME = "Sam Epstein"
function pad(input, length, character){ var padding = length + 1 - input.length; return (padding > 0 ? Array(length + 1 - input.length).join(character || '0') + input : input); };

var newCallTemplate = document.getElementById("newCallTemplate").innerText;
$("#customerList")
	.append(Mustache.render(newCallTemplate, {
		title: "Jane Doe",
		subtitle: "(212) 555-1234",
		status: "finished",
		statusText: "Finished"
	}))
	.append(Mustache.render(newCallTemplate, {
		title: "Bill Smith",
		subtitle: "(212) 555-1234",
		status: "finished",
		statusText: "Finished"
	}))
;
var socket = io.connect('/agent');

var prompts = {
	link: function($el, call){
		$el.html(Mustache.render($('#linkPrompt').text()));
		$el.find('button').click(function(){
			call.sendPrompt({ type: 'link', value: $el.find('input').val() });
			call.logEvent("Sent a link to the callee");
			call.resetPrompt();
			return false;
		}.bind(this));
	},
	email: function($el, call){
		$el.html(Mustache.render($('#emailPrompt').text()));
		$el.find('button').click(function(){
			call.sendPrompt({ type: 'email', value: $el.find('input').val() }, function(res){
				call.logEvent("Email address: " + res);
			});
			call.logEvent("Prompted callee for their email address");
			call.resetPrompt();
			return false;
		}.bind(this));
	}
};

var activeCalls = {};

function Call($call, data) {
	var $prompter = $call.find('.prompter');
	this.$call = $call;
	this.data = data;
	this.$prompter = $prompter;
	$prompter.find('select').on('change', function(e){
		var $target = $(e.target);
		if ($target.val()) {
			prompts[$target.val()]($prompter.find('.prompt_details'), this);
		} else {
			$prompter.find('.prompt_details').empty();
		}
	}.bind(this));
}

Call.prototype.resetPrompt = function() {
	var $select = this.$prompter.find('select');
	$select[0].selectedIndex = 0;
	$select.change();
};

Call.prototype.oncallstatus = function(data) {
	if (data.status === 'in_progress') {
		this.$call[0].className = 'active answered';
		this.$call.find('.status').text('On the line');
		this.logEvent("Call started");
		socket.emit("tell_client", {
			sockID: this.data.sockID,
			repName: REP_NAME
		});
	}
}

Call.prototype.logEvent = function(message) {
	var now = new Date;
	this.$call.find('.callLog').append($('<li>').text(
		now.getHours() + ':' + pad(now.getMinutes(), 2) + ': ' + message
	));
};

Call.prototype.sendPrompt = function(prompt, cb) {
	socket.emit('tell_client', { sockID: this.data.sockID, prompt: prompt }, cb);
};

socket.on("call", function(data){
	var templateData = {
		status: "waiting",
		statusText: "Waiting"
	};
	var $newCall;
	if ((templateData.title = data.name || data.email)) {
		templateData.subtitle = data.phoneNum;
	} else {
		templateData.title = data.phoneNum;
		templateData.subtitle = "New Jersey"; // lol
	}
	$newCall = $(Mustache.render(newCallTemplate, templateData));
	$newCall.one('click', function(){
		this.className = "active answered";
		$newCall.find('.status').text('Connecting');
		socket.emit("call", data);
	});
	activeCalls[data.sockID] = new Call($newCall, data);

	$("#customerList").prepend($newCall);
});

socket.on("call_status", function(data){
	activeCalls[data.sockID].oncallstatus(data);
});
