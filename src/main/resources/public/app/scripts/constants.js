define(['app'], function(app) {
    'use strict';


  //  var IP_ADDRESS = 'obscure-lake-10899.herokuapp.com';
  //  
     var IP_ADDRESS = 'localhost:8080';

    app.constant('API_END_POINT', 'http://' + IP_ADDRESS + '/restful');

});
