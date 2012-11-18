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
	link: function($el, $call, data){
		console.log('foo', arguments);
	},
	email: function($el, $call, data){
		$el.html(Mustache.render($('#emailPrompt').text()));
	}
};

var activeCalls = {};

function Call($call, data) {
	var $prompter = $call.find('.prompter');
	this.$call = $call;
	this.$prompter = $prompter;
	$prompter.find('select').on('change', function(){
		if ($(this).val()) {
			prompts[$(this).val()]($prompter.find('.prompt_details'), $call, data);
		} else {
			$prompter.find('.prompt_details').empty();
		}
	});
}
Call.prototype.oncallstatus = function(data) {
	if (data.status === 'in_progress') {
		this.$call[0].className = 'active answered';
		this.$call.find('.status').text('On the line');
		this.logEvent("Call started");
	}
}

Call.prototype.logEvent = function(message) {
	var now = new Date;
	this.$call.find('.callLog').append($('<li>').text(
		now.getHours() + ':' + pad(now.getMinutes(), 2) + ': ' + message
	));
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
