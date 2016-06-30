require.config({
    baseUrl: 'scripts',
    //urlArgs: "bust=v5",
    paths: {
        'requirejs': '../../bower_components/requirejs/require',
        'angular': '../../bower_components/angular/angular',
        'angular-locale_tr-tr': '../../bower_components/angular-i18n/angular-locale_tr-tr',
        'angular-route': '../../bower_components/angular-route/angular-route',
        'angular-messages': '../../bower_components/angular-messages/angular-messages',
        'angular-resource': '../../bower_components/angular-resource/angular-resource',
        'angular-sanitize': '../../bower_components/angular-sanitize/angular-sanitize',
        'angular-animate': '../../bower_components/angular-animate/angular-animate',
        'angular-touch': '../../bower_components/angular-touch/angular-touch',
        'angular-loading-bar': '../../bower_components/angular-loading-bar/build/loading-bar',
        'angular-modal-service': '../../bower_components/angular-modal-service/dst/angular-modal-service',
        'angular-bootstrap': '../../bower_components/angular-bootstrap/ui-bootstrap',
        'angular-bootstrap-tpls': '../../bower_components/angular-bootstrap/ui-bootstrap-tpls',
        'bootstrap': '../../bower_components/bootstrap/dist/js/bootstrap',
        //'jquery': '../../bower_components/jquery/jquery',
        "mgcrea.ngStrap": "../../bower_components/angular-strap/dist/angular-strap",
        "mgcrea.ngStrap.tpl": "../../bower_components/angular-strap/dist/angular-strap.tpl",
        "angular-xeditable": "../../bower_components/angular-xeditable/dist/js/xeditable",
        "restangular": "../../bower_components/restangular/dist/restangular",
        "angular-ui-router": "../../bower_components/angular-ui-router/release/angular-ui-router",
    },
    shim: {
        'app': {
            deps: [
                'angular',
                'angular-locale_tr-tr',
                'angular-route',
                'angular-messages',
                'angular-resource',
                'angular-sanitize',
                'angular-animate',
                'angular-touch',
                'angular-loading-bar',
                'angular-modal-service',
                'angular-bootstrap',
                'angular-bootstrap-tpls',
                'mgcrea.ngStrap',
                "mgcrea.ngStrap.tpl",
                'bootstrap',
                "angular-xeditable",
                //'jquery',
                "restangular",
                "angular-ui-router",
            ]
        },
        'angular-locale_tr-tr': {
            deps: ['angular']
        },
        'angular-route': {
            deps: ['angular']
        },
        'angular-messages': {
            deps: ['angular']
        },
        'angular-resource': {
            deps: ['angular']
        },
        'angular-sanitize': {
            deps: ['angular']
        },
        'angular-animate': {
            deps: ['angular']
        },
        'angular-touch': {
            deps: ['angular']
        },
        'angular-loading-bar': {
            deps: ['angular']
        },
        'angular-modal-service': {
            deps: ['angular']
        },
        'angular-bootstrap': {
            deps: ['angular']
        },
        'angular-bootstrap-tpls': {
            deps: ['angular']
        },
        'mgcrea.ngStrap': {
            deps: ['angular']
        },
        'mgcrea.ngStrap.tpl': {
            deps: ['mgcrea.ngStrap']
        },
        'bootstrap': {
            deps: ['angular']
        }
        /*,
        		'jquery': {
        			deps: ['angular']
        		}*/
        ,
        'angular-xeditable': {
            deps: ['angular']
        },
        
        'restangular': {
            deps: ['angular']
        },  
        'angular-ui-router': {
            deps: ['angular']
        }
    }
});
