var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}
var mapModel = function(){

}
var myViewModel = function(){
  var self = this;
  this.searchItem = ko.observable('donuts Chicago');

  this.search = function(data){

    console.log("search:"+this.searchItem());
  }

};
ko.applyBindings(new myViewModel());
