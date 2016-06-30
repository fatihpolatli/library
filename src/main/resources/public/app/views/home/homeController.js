define(['app'], function(app) {
    'use strict';

    app.controller('HomeCtrl', ['$scope', 'BookService',
        function($scope, BookService) {

            $scope.bookList = [];

            var tempItem = null;

            $scope.deleteItem = {
                item: null,
                index: ""
            };


            $scope.setDeleteItem = function(item, index) {
                $scope.deleteItem.item = item;
                $scope.deleteItem.index = index;

            };

            $scope.deleteFunction = function() {
                $scope.removeBook($scope.deleteItem.item, $scope.deleteItem.index);
            };

            $scope.removeBook = function(itemData, index) {


                var postData = angular.copy(itemData);

                if (itemData.id !== null && itemData.id !== undefined) {

                    BookService.delete(postData, function(data) {

                        removeFromList(itemData.id);

                    });
                }
            };

            function removeFromList(id) {

                var len = $scope.bookList.length;

                for (var i = 0; i < len; i++) {

                    var item = $scope.bookList[i];

                    if (item.id == id) {


                        $scope.bookList.splice(i, 1);
                        return;
                    }

                }
            }



            getBookList();

            function getBookList() {

                BookService.list(function(data) {

                    $scope.bookList = data;
                })
            }



            $scope.createBook = function(hideFunction) {

                var postData = {

                    name: $scope.bookInfo.name,
                    author: $scope.bookInfo.author
                };

                BookService.addBook(postData, function(data) {

                    getBookList();
                })

            };

            $scope.setSelectedBook = function(item, index) {

                $scope.selectedBook = item;


            };


            function checkNewItem() {

                if ($scope.bookList.length == 0) {

                    return true;
                }

                var item = $scope.bookList[$scope.bookList.length - 1];

                if (item.id == null && (item.name == null || item.url == null)) {

                    return false;
                }

                return true;
            }

            $scope.addBook = function() {

                var checkStatus = checkNewItem();

                if (checkStatus == false) {

                    return;
                }

                $scope.inserted = {
                    id: null,
                    name: null,
                    author: null

                };

                $scope.bookList.push($scope.inserted);
                //$scope.allUsers.push($scope.inserted);
            };




            $scope.cancelEdit = function(itemData, index) {

                var item = $scope.bookList[index];

                if (item.id === null || item.id === undefined) {

                    $scope.bookList.splice(index, 1);

                } else {

                    item = tempItem;

                    tempItem = null;
                }
            };

            $scope.checkData = function(data) {

                if (data === null || data === undefined || data.toString().length === 0) {

                    return "enter valid data!";
                }
            };

            $scope.beginEdit = function(itemData, index) {

                tempItem = itemData;
            };

            function getItemById(id) {

                var len = $scope.bookList.length;

                for (var i = 0; i < len; i++) {

                    var item = $scope.bookList[i];

                    if (item.id == id) {

                        return item;
                    }

                }
            }

            $scope.saveBook = function(itemData, id,form) {

                if(!form.$valid){

                    return;
                }

                var op = null;

                var item = getItemById(id);


                var postData = angular.copy(item);


                postData.name = itemData.name;
                postData.author = itemData.author;



                if (itemData.id !== null && itemData.id !== undefined) {

                    op = "update";

                    postData.id = itemData.id;
                } else {

                    op = "add";

                }


                BookService.edit(postData, function(data) {

                    if(data == null){

                        $scope.bookList.pop();
                    }

                    //updateBookList(data);


                });

                function updateBookList(bookData) {

                    var len = $scope.bookList.length;

                    for (var i = 0; i < len; i++) {

                        var item = $scope.bookList[i];

                        if (item.name == bookData.name) {

                            $scope.bookList[i] = bookData;

                            return;
                        }

                    }
                }
            };
        }
    ]);

});
