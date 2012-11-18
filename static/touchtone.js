"use strict";
window.touchtone = { };

touchtone.Widget = function(number, config){
	var header, subtitle;
	this.number = number;
	this.flow = config.flow;
	this.flowIndex = -1;
	this.metadata = {};

	this.el = document.createElement('div');
	this.el.id = 'callWidget';
	
	// Get some button action going
	this.button = document.createElement('div');
	this.button.id = 'callButton';

	header = document.createElement('h2');
	header.appendChild(document.createTextNode(config.title || 'Click here to call us'));
	this.button.appendChild(header);

	subtitle = document.createElement('p');
	subtitle.id = 'callButtonSubtitle';
	subtitle.appendChild(document.createTextNode(number));
	this.button.appendChild(subtitle);

	this.el.appendChild(this.button);

	this.isOpen = false;
	this.button.addEventListener('click', this.onclick.bind(this), false);
};

touchtone.Widget.prototype.onclick = function(){
	if (this.isOpen) return;
	this.open();
};

touchtone.Widget.prototype.open = function(){
	this.isOpen = true;
	this.windowEl = document.createElement('div');
	this.windowEl.id = 'callWindow';
	this.progressEl = document.createElement('ul');
	this.progressEl.id = 'callProgress';
	this.windowEl.appendChild(this.progressEl);
	this.el.appendChild(this.windowEl);
	this.advance();
};

touchtone.Widget.prototype.advance = function(){
	var flowConfig, step;
	this.flowIndex++;
	if ((flowConfig = this.flow[this.flowIndex])) {
		step = new touchtone.flow[flowConfig.kind](this, flowConfig);
		this.progressEl.appendChild(step.el);
	} else {
		this.progressEl.appendChild((new touchtone.StartCallFlow(this)).el);
	}
};

touchtone.Widget.prototype.startCall = function(){
	if (this.inCall) return;
	this.inCall = true;
	this.socket = io.connect();
	this.socket.emit("call", this.metadata);
	this.socket.on("prompt", function(data) {
		console.log(data);
	});
	this.socket.on("tell_client", this.onmessage.bind(this));
};

touchtone.Widget.prototype.onmessage = function(data){
	console.log("Got a message from the agent, should do something with it", data);
}
touchtone.flow = {};

touchtone.flow.choice = function (owner, config) {
	var $el = $('<li>', { 'class': 'callType' });
	var $form = $('<form>').appendTo($el);
	var $summary = $('<div>', { 'class': 'summary' }).hide().appendTo($el);
	var $choice = $('<p>', { 'class': 'choice' });

	this.owner = owner;
	this.config = config;

	if (config.titleHTML) {
		$form.append($('<h3>').html(config.titleHTML));
	}
	$form.append($('<ul>', { 'class': 'callTypes' })
		.append(config.choices.map(function(choice) {
			return $('<li>').append($('<button>', {
				'class': 'fancy',
				'value': choice.value
			}).text(choice.label));
		}))
	);

	$summary
		.append($('<h3>').text("You\u2019re calling to\u2026"))
		.append($choice)
	;

	this.el = $el[0];
	$form.on('click', 'button', function(e){
		this.owner.metadata[this.config.name] = e.target.value;
		$form.hide();
		$choice.text(e.target.textContent);
		$summary.show();
		this.owner.advance();
		return false;
	}.bind(this));
};

touchtone.StartCallFlow = function(parent){
	var el = this.el = $('<li>', { 'class': 'startCall' })
		.append($('<p>').html('We can call you and you&rsquo;ll speak to a representative right away. <strong>Enter your phone number:</strong>'))
		.append($('<form>').html('<input type="tel" name="number"> <button class="fancy">Call me!</button>').on('submit', function(e) {
			// Hey look, no validation at all
			parent.metadata.phoneNum = e.target.elements["number"].value;
			// parent.metadata.userName = $("#userName").text();
			// So hax
			$(el).html('<p style="margin: 0.3em 0; text-align: center; font-weight: bold">Connecting&hellip;</p>');
			parent.startCall();
			return false;
		}))[0]
	;
};
