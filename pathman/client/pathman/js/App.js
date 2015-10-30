/**
 * Created by tylevine on 7/14/14.
 */

(function (nx) {
    /**
     * define application
     */
    var Shell = nx.define(nx.ui.Application, {
        methods: {
            start: function () {
                // initialize a topology
                var main = new pathman.view.Main();
                var mainViewModel = new pathman.viewmodel.Main(main);
                main.model(mainViewModel);

                //attach topology to document
                main.attach(this);

                this.on('resize', function () {
//                    console.log('adapting via resize');
                    main.resolve('topo').adaptToContainer();
                });

                // allow for easy console debugging
                nx.app.mainview = main;
                nx.app.mainviewmodel = mainViewModel;
            },
            getContainer: function () {
                return new nx.dom.Element(document.body);
            }
        }
    });

    /**
     * create application instance
     */
    var host = location.host;
    var protocol = location.protocol;
    odl.Config = new nx.Config({
        socketUrl:'ws://'+location.hostname+':8008/message/terminal/'
    });
    var shell = new Shell();
    /**
     * invoke start method
     */
    shell.start();
}(nx));
