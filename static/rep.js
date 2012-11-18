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
		$(this).addClass('active');
		socket.emit("call", data);
	});
	$("#customerList").prepend($newCall);
});
