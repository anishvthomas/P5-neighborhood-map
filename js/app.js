//fix issue with map objects and boostrap where the div width by default is 1
$(window).resize(function () {
  var h = $(window).height(),
  offsetTop = 40; // Calculate the top offset

  $('#map').css('height', (h - offsetTop));
  $('#ulresultlist').css('max-height', (h - offsetTop));
  //overflow: scroll

}).resize();

//Activate items when they are clicked from the results list
var current;
var activateItem = function(el) {
  if (current) {
    current.classList.remove('active');
  }
  current = el;
  el.classList.add('active');
}

var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.943, lng: -87.653},
    zoom: 20
  });
}
var prevInfowindow;
var marker;
var markerList=[];
var markerListByName={};
var businessList =[];

var myViewModel = function(){

  var self = this;
  //Starter search item
  this.searchItem = ko.observable('pub');
  this.ResultList = ko.observableArray();

  this.initializeBusinessList = function ()
  {
    self.search();
  }

  this.selectedItem= function(data){
    highlightItem(markerListByName[data.name]);

  }

  /*
  Filter the results when user types in the searchbar.
  Also remove the markers which are not related to the items which matches
  the search criteria
  */
  this.filterResults = function()
  {
    var searchText = self.searchItem().toLowerCase();
    this.ResultList().forEach(function(current,index,array){

      if(current.name.toLowerCase().indexOf(searchText)!=-1)
      {
        //change visibility of the list item
        current.matchSearch(true);
        //change visibility of the marker
        markerListByName[current.name].setMap(map);
      }
      else {
        current.matchSearch(false);
        markerListByName[current.name].setMap(null);
      }
    });
    return true;
  }

  /*
  Search in Yelp for the items entered in the searchbar
  */
  this.search = function(){

    //Object needed for Yelp API
    var auth = {
      consumerKey: "b3sCi6d9XHfIyf3w6kn7dQ",
      consumerSecret: "QvGK7RkbxbEJ1HqJ30NSlBYRWlo",
      accessToken: "ROR5-2m64mm9QFNuCX6OpWKkuFKrkYUf",
      accessTokenSecret: "BapPJUqMRupeDZTlmkk0szooBUc",
      serviceProvider : {
        signatureMethod : "HMAC-SHA1"
      }
    };

    var accessor = {
      consumerSecret : auth.consumerSecret,
      tokenSecret : auth.accessTokenSecret
    };

    //Search location is hardcoded as Chicago

    var searchItem=self.searchItem();
    var searchLoc ="Chicago";
    var parameters = [];
    parameters.push(['term', searchItem]);
    parameters.push(['location', searchLoc]);
    parameters.push(['callback', 'cb']);
    parameters.push(['oauth_consumer_key', auth.consumerKey]);
    parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
    parameters.push(['oauth_token', auth.accessToken]);
    parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

    var message = {
      'action' : 'http://api.yelp.com/v2/search',
      'method' : 'GET',
      'parameters' : parameters
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);

    var parameterMap = OAuth.getParameterMap(message.parameters);

    /*
    Ajax call to Yelp
    Clear the existing ResultList on successfull call
    */
    $.ajax({
      'url' : message.action,
      'data' : parameterMap,
      'cache': true,
      'dataType' : 'jsonp',
      'global' : true,
      'jsonpCallback' : 'cb',
      'success' : function(data){

        self.ResultList.removeAll();
        self.parseAPIResponse(data);
      },
      'timeout':3000,
      'error':function (){
        self.searchItem(self.searchItem()+" We encountered an error while contacting Yelp, please try again");

      }
    });
  }

  /*

  Parse the API result and get the information needed for display

  */
  self.parseAPIResponse =function (data) {

    var myBusinessArr = data["businesses"];

    $.each (myBusinessArr, function (key, value){

      var image_url=value["image_url"];
      var phone=value["phone"];
      var name=value["name"];
      var url=value["url"];
      var businessItem ={};
      businessItem["latitude"]=value["location"]["coordinate"]["latitude"];
      businessItem["longitude"]=value["location"]["coordinate"]["longitude"];;
      businessItem["image_url"]=image_url;
      businessItem["url"]=url;
      businessItem["phone"]=phone;
      businessItem["name"]=name;
      businessItem["matchSearch"]=ko.observable(true);

      self.ResultList.push(businessItem);

      $.each(businessItem,function(key,value){

      });

    });

    addMapMarkers(self.ResultList());
  }

  //toggle the marker
  function toggleBounce(marker) {

    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);},1000);
      }
    }


    //Clicked the marker
    function highlightItem(marker)
    {
      toggleBounce(marker);
      map.panTo(marker.getPosition());
      var infowindow = new google.maps.InfoWindow({
        content: marker.content,
        maxWidth:250});
        if(prevInfowindow)
        prevInfowindow.close();
        infowindow.open(map, marker);
        prevInfowindow= infowindow;
      }

      function addMapMarkers(businessList)
      {
        var pos=1;
        var bounds = new google.maps.LatLngBounds();

        //  $.each (businessList, function (key, value) {
        businessList.forEach(function(item,index,array){
          var name = item["name"];
          var latitude= item["latitude"];
          var longitude= item["longitude"];
          var url =item["url"];
          var imageurl =item["image_url"];
          var phone = item["phone"];



          var myLatlng = new google.maps.LatLng(latitude,longitude);
          var mapOptions = {
            zoom: 15,
            center: myLatlng
          }

          bounds.extend(myLatlng);

          var contentString =
          '<div id="content">'
          +'<h6>'+name+'</h6>'
          +'<div id="bodyContent">'
          +'<p>'+phone+'</p>'
          +'<p> <img src="'+imageurl+'"></p>'
          +'<p><a href="'+url+'">Yelp</a>'
          +'</p>'
          +'</div>'
          +'</div>';

          var marker = new google.maps.Marker({
            position: myLatlng,
            title:name,
            map:map,
            animation: google.maps.Animation.DROP,
            content:contentString
          });


          marker.addListener('click', function(){
            highlightItem(marker);
          });
          markerList.push(marker);
          markerListByName[name]=marker;

        });


        map.fitBounds(bounds);
      }

      //initalize on startup with a default serach for Pubs in Chicago
      self.initializeBusinessList();
    };
    ko.applyBindings(new myViewModel());
