
function SimpleDisplayCalculator(output_id, geo_file, vote_file, center_location, weight_value) {


  var weighted_vote_table = VoteCalculator(geo_file, vote_file, center_location, weight_value);

  var html_fill = "";

  for (key in weighted_vote_table) {

    html_fill += key;
    html_fill += ":";
    html_fill += weighted_vote_table[key];
    html_fill += "<br>";

  }

  $(output_id).html(html_fill);

}



function CalculateWeightMultiplier(precinct_location, center_location, weight_value) {

  //Compute the spherical distance in arc length
  var degrees_to_radians = Math.PI / 180.000;

  var phi1 = (90.000 - precinct_location[0].geometry.coordinates[1]) * degrees_to_radians;
  var phi2 = (90.000 - center_location[1]) * degrees_to_radians;
  var theta1 = precinct_location[0].geometry.coordinates[0] * degrees_to_radians;
  var theta2 = center_location[0] * degrees_to_radians;

  var cos = (Math.sin(phi1) * Math.sin(phi2) * Math.cos(theta1 - theta2) + Math.cos(phi1) * Math.cos(phi2));
  var arc = Math.acos(cos);

  // In kilometers
  var distance = arc * 6371;


  // Multiplied by weighter

  var weighter = Math.exp(distance * weight_value * -1.0000);
  return weighter;

}



function VoteCalculator(geo_file, vote_file, center_location, weight_value) {


  var weighted_vote_table = {};

  // Load the GeoJSON file to variable geo_data
  var geo_data = (function() {
    var json = null;
    $.ajax({
      'async': false,
      'global': false,
      'url': '../data/' + geo_file,
      'dataType': "json",
      'success': function(data) {
        json = data;
      }
    });
    return json;
  })();

  // Load the vote table file to variable vote_data

  var vote_data = (function() {
    var json = null;
    $.ajax({
      'async': false,
      'global': false,
      'url': '../data/' + vote_file,
      'dataType': "json",
      'success': function(data) {
        json = data;
      }
    });
    return json;
  })();


  $.each(vote_data.precincts, function() {

    var precinct_id = this.id;

    var precinct_location = JSON.search(geo_data, '//features[properties/id=' + precinct_id + ']');

    var vote_multiplier = CalculateWeightMultiplier(precinct_location, center_location, weight_value);

    var votes = this.votes;

    for (var key in votes) {
      this_vote_choice = votes[key];
      for (var key in this_vote_choice) {
        vote_answer = key;
        if (weighted_vote_table[vote_answer] == null) {
          weighted_vote_table[vote_answer] = this_vote_choice[key] * vote_multiplier;
        } else {
          weighted_vote_table[vote_answer] += this_vote_choice[key] * vote_multiplier;
        }
      }
    }

  });

return weighted_vote_table;
}
