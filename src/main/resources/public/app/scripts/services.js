/*jshint sub:true*/
define(['app'], function(app) {
    'use strict';


    app.service('WarningService', ['$rootScope', "$alert",
        function($rootScope, $alert) {
            //
            var service = {};
            service.alert = function(title, type, content) {
                $alert({
                    title: title,
                    container: 'body',
                    content: content,
                    placement: 'top',
                    type: type,
                    //duration: 3,
                    duration: 3,
                    show: true
                });
            };
            service.alertDismissable = function(title, type, content) {
                $alert({
                    title: title,
                    container: 'body',
                    content: content,
                    placement: 'top',
                    type: type,
                    duration: 3,
                    show: true
                });
            };

            service.errorAlert = function(errorCode,errorMessage){

            	service.alertDismissable("Error!","danger",errorMessage);
            }

            return service;
        }
    ]);

    app.service("ServiceHandler", ["$rootScope",'WarningService',
        function($rootScope,WarningService) {
            var service = {};


            service.handleResponseByCode = function(code, data) {

                switch (code) {

                    case 200:

                        break;
                   
                    default:
                        WarningService.errorAlert(code, data.error);
                        break;

                }
            };


            return service;
        }
    ]);

    app.service('AuthInterceptorService', ['$q', '$rootScope',  '$injector',
        function($q, $rootScope,  $injector) {



            var authInterceptorServiceFactory = {};
            var _request = function(config) {
                config.headers = config.headers || {};

                return config;
            };
            var _response = function(config) {

                var ServiceHandler = $injector.get('ServiceHandler');

                if (config.status !== 200) {}

                if (config.status == 200 && config.data != null && config.data.code != null) {

                    var code = config.data.code;

                    ServiceHandler.handleResponseByCode(code, config.data);
                } else {


                    ServiceHandler.handleResponseByCode(config.status, config.data);
                }

                return config;
            }
            var _responseError = function(rejection) {

                /*var AuthenticationService = $injector.get('AuthenticationService');
                var MetricGlobalServices = $injector.get('MetricGlobalServices');


                if (rejection.status === 0) {

                    MetricGlobalServices.serverConnectionAlert();

                } else if (rejection.status === 400) {

                    if (rejection.config.url.indexOf('oauth/token') !== -1 && rejection.data.error === "invalid_grant") {

                        AuthenticationService.setWrongLoginStatus(true);
                        MetricGlobalServices.wrongLoginError();
                    }

                } else if (rejection.status === 401) {

                    if (rejection.data.error === "invalid_token") {

                        AuthenticationService.resetLoginData();
                        MetricGlobalServices.invalidTokenError();

                    } else if (rejection.data.error === "unauthorized") {

                        AuthenticationService.setWrongLoginStatus(true);
                        MetricGlobalServices.wrongLoginError();

                    }
                } else if (rejection.status === 403) {

                    MetricGlobalServices.accessDeniedMessage();

                } else if (rejection.config.url.indexOf('oauth/logout') !== -1) {

                    AuthenticationService.resetLoginData();


                } else {

                    MetricGlobalServices.errorAlert(rejection.data.error, rejection.data.error_description);

                }*/


                return $q.reject(rejection);
            };

            authInterceptorServiceFactory.request = _request;
            authInterceptorServiceFactory.response = _response;
            authInterceptorServiceFactory.responseError = _responseError;
            return authInterceptorServiceFactory;
        }
    ]);

});
