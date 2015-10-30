(function (nx) {
    nx.define('odl.WsshTerminalWindow', nx.ui.Component, {
        events: ['input', 'close', 'message'],
        view: {
            props: {
                'class': 'terminal-window'
            },
            content: [
                {
                    props: {
                        'class': 'terminal-header'
                    },
                    content: [
                        {
                            props: {
                                'class': 'btn-group btn-group-sm pull-right'
                            },
                            content: [
                                {
                                    tag: 'a',
                                    props: {
                                        'class': 'btn btn-plain btn-minimize'
                                    },
                                    events: {
                                        click: '{#minimize}'
                                    },
                                    content: {
                                        tag: 'i',
                                        props: {
                                            'class': 'fa fa-chevron-down'
                                        }
                                    }
                                },
                                {
                                    tag: 'a',
                                    props: {
                                        'class': 'btn btn-plain btn-maximize'
                                    },
                                    events: {
                                        click: '{#maximize}'
                                    },
                                    content: {
                                        tag: 'i',
                                        props: {
                                            'class': 'fa fa-chevron-up'
                                        }
                                    }
                                },
                                {
                                    tag: 'button',
                                    props: {
                                        'class': 'btn btn-plain'
                                    },
                                    events: {
                                        click: '{#close}'
                                    },
                                    content: {
                                        tag: 'i',
                                        props: {
                                            'class': 'fa fa-times'
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            tag: 'h2',
                            content: '{#title}'
                        }
                    ]
                },
                {
					name:'terminal-body',
                    props: {
                        'class': 'terminal-body'
                    }
                }
            ]
        },
        properties: {
            address: null,
            port:null,
            title: null,
            maximized: {
                get: function () {
                    return this._maximized;
                },
                set: function (value) {
                    if (!!value) {
                        this.maximize();
                    }
                    this._maximized = value;
                }
            },
            focused: {
                get: function () {
                    return this._focused;
                },
                set: function (value) {
                    if (!!value) {
                        this.focus();
                    }
                    this._focused = value;
                }
            },
            opened:{
                set:function(value){
                    if(value){
                        this.open();
                    }
                }
            },
            lines:null,
			term:{
				set:function(value){
					var terminal_body = this.view('terminal-body');
					terminal_body.dom().$dom.appendChild(value.element);
					this._term = value;
				}
			}
        },
        methods: {
            init: function (address,port) {
                this.inherited();
                this.address(address);
                this.port(port);
            },
            open:function(){
				//return this.conn().open();
				var address = this.address();
				var port = this.port();
				var options = {"hostname":address,"command":"","authentication_method":"password","port":port||22};
				if(window.backend_cfg){
					var cfg = window.backend_cfg;
					var server = cfg.server || window.location.hostname;
					var server_port = cfg.wssh_server_port || window.location.port;
					var server_protocol = cfg.wssh_server_protocol || '';
					options.server_protocol = server_protocol;
					options.server = server + (server_port?":" + server_port:'');
				}
				var term = Terminal.createInstance(options);
				this.term(term);
				window.term = term;
            },
            maximize: function () {
                this.resolve("@root").removeClass('minimized');
                this.focus();
            },
            minimize: function () {
                this.maximized(false);
                this.resolve('@root').addClass('minimized');
            },
            close: function () {
                this.fire('close');
                this.destroy();
            },
            focus: function () {
				this.term().focus();
            }
        }
    });
})(nx);
