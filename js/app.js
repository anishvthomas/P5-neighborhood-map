//fix issue with map objecst and boostrap where the dic=v width by default is 1
$(window).resize(function () {
  var h = $(window).height(),
  offsetTop = 40; // Calculate the top offset

  $('#map').css('height', (h - offsetTop));
  $('#ulresultlist').css('max-height', (h - offsetTop));
  //overflow: scroll
  
}).resize();

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
    zoom: 16
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
    console.log("initializeBusinessList");
    console.log("searchwith"+this.searchItem());
    self.search();
  }

  this.selectedItem= function(data){
    highlightItem(markerListByName[data.name]);

  }

  this.filterResults = function()
  {
    console.log("filter:"+this.searchItem());
    this.ResultList().forEach(function(current,index,array){
      console.log("forEach "+current.name+ " "+current.name.indexOf(self.searchItem()));
      if(current.name.indexOf(self.searchItem())!=-1)
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


  this.search = function(){

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

    /*
    *	Create a JSON object "message" to pass on to OAuth.setTimestampAndNonce
    */
    var message = {
      'action' : 'http://api.yelp.com/v2/search',
      'method' : 'GET',
      'parameters' : parameters
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var parameterMap = OAuth.getParameterMap(message.parameters);
    console.log("Ajax call");
    $.ajax({
      'url' : message.action,
      'data' : parameterMap,
      'cache': true,
      'dataType' : 'jsonp',
      'global' : true,
      'jsonpCallback' : 'cb',
      'success' : function(data){
        console.log(data);
        self.ResultList.removeAll();
        self.parseAPIResponse(data);
      }
    });
  }

  self.parseAPIResponse =function (data) {
    console.log("parseAPIResponse"+data);
    var myBusinessArr = data["businesses"];
    //console.log("businesss: "+ myBusinessArr.length);
    $.each (myBusinessArr, function (key, value){
      //console.log("K "+key);
      //console.log("v "+value["name"]);
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
      //businessList[name]=businessItem;
      self.ResultList.push(businessItem);

      $.each(businessItem,function(key,value){
        //  console.log(key+":"+"\""+value+"\"");
      });
      //console.log(name+" -> "+businessList[name]+" "+businessList[name]["coordinate"]["latitude"]+" ,"+businessList[name]["coordinate"]["longitude"]);
    });
    //clearExistingMarkers();
    addMapMarkers(self.ResultList());
  }

  //toggle the marker
  function toggleBounce(marker) {
    //console.log("toggle"+Object.keys(e));
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);},1000);
      }
    }


    //Cliked the marker
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

          //console.log("Iter "+name+" "+value["url"]+latitude+","+longitude);

          var myLatlng = new google.maps.LatLng(latitude,longitude);
          var mapOptions = {
            zoom: 8,
            center: myLatlng
          }
          //var map = new google.maps.Map(document.getElementById("map"), mapOptions);
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
          //  console.log("contentString "+contentString)
          /*var infowindow = new google.maps.InfoWindow({
          content: contentString

        });*/
        marker.addListener('mouseover', function() {
          //infowindow.open(map, marker);
        });
        marker.addListener('mouseout', function() {
          //infowindow.close();
        });
        marker.addListener('click', function(){
          highlightItem(marker);
        });
        markerList.push(marker);
        markerListByName[name]=marker;

      });


      map.fitBounds(bounds);
    }

    //initalize
    self.initializeBusinessList();
  };
  ko.applyBindings(new myViewModel());
