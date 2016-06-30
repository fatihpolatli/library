define(['app'], function(app) {

    app.service('BookService', ['Restangular',
        function(Restangular) {

            var Base = Restangular.all('books');

            var service = {};


            service.list = function(callback) {

                Base.one("list").get().then(function(data) {

                    if (data.code === 200) {

                        callback(data.data);
                    }
                });

            };

            service.edit = function(postData, callback) {

                Base.all("update").post(postData).then(function(data) {

                    if (data.code === 200) {

                        callback(data.data);
                    }else{
                        callback(null);
                    }
                });

            };

            service.delete = function(postData, callback) {

                Base.all("delete").post(postData).then(function(data) {

                    if (data.code === 200) {

                        callback(data.data);
                    }
                });

            };


            return service;

        }
    ])
});
