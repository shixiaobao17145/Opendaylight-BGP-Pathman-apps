Terminal.prototype._mode = 'init';
Terminal.prototype.setState = function(mode){
	var old = this._mode;
	this._mode = mode;
	this.emit('mode',mode,old);
}
Terminal.prototype.getState = function(){
	return this._mode;
}
//{"hostname":"localhost","command":"","authentication_method":"password","port":2222}
Terminal.createInstance = function(options) {
    var client = new WSSHClient();
    var term = new Terminal(80, 24, function(key) {
		var mode = this.getState();
		if(mode=='connected'){
			client.send(key);
		}
    });
	term.connectOpts = options;
    term.open();
    term.resize(80, 24);
	term._username = '';
	term._password = '';
	term.setState('username');
	term.write('username: ')
		//            term.write('Connecting...');
	term.on('keypress',function(key){
		var mode = this.getState();
		if(mode=='username'){
			if(key==''){
				this.setState('password');
			}
			this.write(key);
			this._username += key;
		}else if(mode =='password'){
			if(key==''){
			}else{
				term.write('*');
				this._password += key;
			}
		}
	});
	term.on('keydown',function(ev){
		var keyCode = ev.keyCode;
		var mode = this.getState();
		if((mode=="username" || mode=='password')){
			if( keyCode===8){//backspace
				var val = this['_'+mode];
				if(val){
					this['_'+mode] = val.substr(0,val.length-1);
					term.write('\x08\x1b[K');
					//						term.write('\r\x0c\x1b]0;password: ~password: ');
				}
			}else if(keyCode===13){
				if(mode=='username'){
					term.setState('password');
					term.write('\r\npassword: ');

				}else if(mode=='password'){
					var opts = this.connectOpts;
					opts.username = this._username;
					opts.password = this._password;
//					console.log(opts);
					term.write('\r\nConnecting...');
					client.connect($.extend(opts, {
						onError: function(error) {
							term.write('Error: ' + error + '\r\n');
						},
						onConnect: function() {
							if(term.getState()!='connected'){
								term.setState('connected');
							}

							// Erase our connecting message
							term.write('\r\r');
						},
						onClose: function() {
							term.write('Connection Reset By Peer');
						},
						onData: function(data) {
							term.write(data);
						}
					}));
				}
			}
		}
	});

	return term;
}
