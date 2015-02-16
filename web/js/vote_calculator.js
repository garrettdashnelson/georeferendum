

function SimpleDisplayCalculator(output_id) {

  var output = VoteCalculator("leecounty.json", "landfill_referendum.json");

  $(output_id).html( output );


}


function VoteCalculator(geo_file, vote_file) {

  // Load the GeoJSON file to variable geo_data
  var geo_data = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': '../data/' + geo_file,
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
})();

  // Load the vote table file to variable vote_data

var vote_data = (function () {
  var json = null;
  $.ajax({
      'async': false,
      'global': false,
      'url': '../data/' + vote_file,
      'dataType': "json",
      'success': function (data) {
          json = data;
      }
  });
  return json;
})();



$.each(vote_data.precincts, function() {

  var precinct_id = this.id;

  var precinct_location = JSON.search( geo_data, '//features[properties/id=' + precinct_id + ']');

  votes = this.votes;


});




}
