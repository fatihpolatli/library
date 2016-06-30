define(['routes', 'dependencyResolverFor'], function(config, dependencyResolverFor) {
    'use strict';

    /**
     * @ngdoc overview
     * @name ccmApp
     * @description
     * # ccmApp
     *
     * Main module of the application.
     */


    var app = angular.module('app', [
        /* 'ngAnimate',*/
        'ngMessages',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'angular-loading-bar',
        'mgcrea.ngStrap.modal',
        'mgcrea.ngStrap.alert',
        'mgcrea.ngStrap.collapse',
        'mgcrea.ngStrap.tooltip',
        'mgcrea.ngStrap.tab',
        'mgcrea.ngStrap.popover',
        'mgcrea.ngStrap.aside',
        'mgcrea.ngStrap.helpers.dateParser',
        'mgcrea.ngStrap.datepicker',
        'mgcrea.ngStrap.typeahead',
        'mgcrea.ngStrap.select',
        'mgcrea.ngStrap.button',
        'mgcrea.ngStrap.helpers.parseOptions',
        'xeditable',
        'restangular',
        'ui.router'
    ]).config(['$stateProvider',
        '$urlRouterProvider',
        '$routeProvider',
        '$locationProvider',
        '$controllerProvider',
        '$compileProvider',
        '$filterProvider',
        '$popoverProvider',
        '$provide',
        'cfpLoadingBarProvider',
        '$modalProvider',
        '$httpProvider',
        'API_END_POINT',
        'RestangularProvider',
        function($stateProvider,
            $urlRouterProvider,
            $routeProvider,
            $locationProvider,
            $controllerProvider,
            $compileProvider,
            $filterProvider,
            $popoverProvider,
            $provide,
            cfpLoadingBarProvider,
            $modalProvider,
            $httpProvider,
            API_END_POINT,
            RestangularProvider) {

            app.controller = $controllerProvider.register;
            app.directive = $compileProvider.directive;
            app.filter = $filterProvider.register;
            app.factory = $provide.factory;
            app.service = $provide.service;


            $httpProvider.interceptors.push('AuthInterceptorService');

            RestangularProvider.setBaseUrl(API_END_POINT);

            RestangularProvider.setRestangularFields({
                id: "_id"
            });






            $urlRouterProvider.otherwise("/");

            if (config.routes !== undefined) {
                angular.forEach(config.routes, function(route, path) {

                    $stateProvider.state(path, {
                        url: route.url,
                        templateUrl: config.defaultRoutePath + route.templateUrl,
                        resolve: dependencyResolverFor(route.dependencies),
                        controller: route.controller,
                        title: route.title,
                        access: route.access,
                        views: route.views,
                        params: route.params
                    });
                });
            }

            cfpLoadingBarProvider.includeSpinner = false;

        }
    ]);


    return app;
});
