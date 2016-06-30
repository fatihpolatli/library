define(['app'], function(app) {
    'use strict';

    var base = "";
    return {
        defaultRoutePath: '',
        routes: {
            'home': {
                url: "/",
                title: 'Home',
                templateUrl: '/app/views/home/home.tpl.html',
                controller: 'HomeCtrl',
                dependencies: [
                    base + '/app/views/home/homeController.js',
                    base + '/app/views/home/homeService.js'
                ]
            }
        }
    };
});
