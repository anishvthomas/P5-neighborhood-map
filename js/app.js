var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.943, lng: -87.653},
    zoom: 8
  });
}
var markerList=[];
var myViewModel = function(){

  var self = this;
  //Starter search item
  this.searchItem = ko.observable('pub');

  this.initializeBusinessList = function ()
  {
    console.log("initializeBusinessList");
    console.log("searchwith"+this.searchItem());
    self.search();
  }

  this.search = function(){
    console.log("search:"+self.searchItem());

    var auth = {
      consumerKey: "b3sCi6d9XHfIyf3w6kn7dQ",
      consumerSecret: "QvGK7RkbxbEJ1HqJ30NSlBYRWlo",
      accessToken: "ROR5-2m64mm9QFNuCX6OpWKkuFKrkYUf",
      accessTokenSecret: "BapPJUqMRupeDZTlmkk0szooBUc",
      serviceProvider : {
        signatureMethod : "HMAC-SHA1"
      }
    };

    /*
    *	Create a variable "accessor" to pass on to OAuth.SignatureMethod
    */
    var accessor = {
      consumerSecret : auth.consumerSecret,
      tokenSecret : auth.accessTokenSecret
    };

    /*
    *	Create a array object "parameter" to pass on "message" JSON object
    */
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
        self.parseAPIResponse(data);
      }
    });
  }

  self.parseAPIResponse =function (data) {
  console.log("parseAPIResponse"+data);
    var myBusinessArr = data["businesses"];
    var businessList ={};
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
      businessList[name]=businessItem;


      //console.log(name+" -> "+businessList[name]+" "+businessList[name]["coordinate"]["latitude"]+" ,"+businessList[name]["coordinate"]["longitude"]);
    });
    //clearExistingMarkers();
    addMapMarkers(businessList);
  }

  function addMapMarkers(businessList)
  {
    var pos=1;
    var bounds = new google.maps.LatLngBounds();

    $.each (businessList, function (key, value) {
      var name = key;
      var latitude= value["latitude"];
      var longitude= value["longitude"];
      var url =value["url"];
      var imageurl =value["image_url"];
      //console.log("Iter "+name+" "+value["url"]+latitude+","+longitude);

      var myLatlng = new google.maps.LatLng(latitude,longitude);
      var mapOptions = {
        zoom: 8,
        center: myLatlng
      }
      //var map = new google.maps.Map(document.getElementById("map"), mapOptions);
      bounds.extend(myLatlng);
      marker = new google.maps.Marker({
        position: myLatlng,
        title:name,
        map:map
      });
      markerList.push(marker);
      var contentString = '<div id="content">'+
      name+
      '<div id="bodyContent">'
      +'<img src="'+imageurl+'">'+
      '<p>'+
      '<a href="'+url+'">'+
      url+
      '</p>'+
      '</div>'+
      '</div>';

    //  console.log("contentString "+contentString)
      var infowindow = new google.maps.InfoWindow({
        content: contentString
      });
      marker.addListener('click', function() {
        infowindow.open(map, marker);
      });

    });

    map.fitBounds(bounds);
  }

  //initalize
  self.initializeBusinessList();
};
ko.applyBindings(new myViewModel());
