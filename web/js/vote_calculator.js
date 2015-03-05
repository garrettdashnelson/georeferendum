

function voteObject(data_file) {

	this.data_file = data_file;
	this.json = ( function() {
    	var json = null;
			$.ajax({
			  'async': false,
			  'global': false,
			  'url': '../data/' + data_file,
			  'dataType': "json",
			  'success': function(data) {
				json = data;
			  }
			});
			return json;
		  })();
	
}


voteObject.prototype = {

	computeWeights: function(center_point, weight_value) {
	
	this.weightedJson = null;
	this.weightedJson = this.json;
	
	for(precinct in this.weightedJson.features) { 

		weighter = calculateWeightMultiplier( this.weightedJson.features[precinct].geometry.coordinates, center_point, weight_value );
		
			for( vote in this.weightedJson.features[precinct].properties.votes ) {
			
				this.weightedJson.features[precinct].properties.votes[vote] = this.weightedJson.features[precinct].properties.votes[vote] * weighter;
				
				}
		
		}
		
	},
	
	displayVoteTotals: function(display_div) {
	
		$(display_div).html("kaka");
	
	}
	
}





function displayWeightedVote(output_id, data_file, center_location, weight_value) {


  var weighted_vote_table = voteCalculator(data_file, center_location, weight_value);

// console.log(weighted_vote_table);

	var total_votes = 0;
	$.each(weighted_vote_table, function(key, val) { total_votes += val; } );
	console.log(total_votes);

  var html_fill = "";

  for (key in weighted_vote_table) {

    html_fill += key;
    html_fill += ":";
    html_fill += weighted_vote_table[key];
    html_fill += " (";
    html_fill += weighted_vote_table[key]/total_votes * 100;
    html_fill += "%)";
    html_fill += "<br>";

  }

  $(output_id).html(html_fill);

}



function calculateWeightMultiplier(precinct_location, center_location, weight_value) {

  //Compute the spherical distance in arc length
  var degrees_to_radians = Math.PI / 180.000;

  var phi1 = (90.000 - precinct_location[1]) * degrees_to_radians;
  var phi2 = (90.000 - center_location[0]) * degrees_to_radians;
  var theta1 = precinct_location[0] * degrees_to_radians;
  var theta2 = center_location[1] * degrees_to_radians;

  var cos = (Math.sin(phi1) * Math.sin(phi2) * Math.cos(theta1 - theta2) + Math.cos(phi1) * Math.cos(phi2));
  var arc = Math.acos(cos);

  // In kilometers
  var distance = arc * 6371;


  // Multiplied by weighter

  var weighter = Math.exp(distance * weight_value * -1.0000);
  return weighter;

}



function voteCalculator(data_file, center_location, weight_value) {


  var weighted_vote_table = {};

  // Load the data file to variable 'data'
  var data = (function() {
    var json = null;
    $.ajax({
      'async': false,
      'global': false,
      'url': '../data/' + data_file,
      'dataType': "json",
      'success': function(data) {
        json = data;
      }
    });
    return json;
  })();

// console.log(data.features);

  $.each(data.features, function() {

// console.log(this.geometry.coordinates);


	var vote_multiplier = calculateWeightMultiplier(this.geometry.coordinates, center_location, weight_value);
// console.log(vote_multiplier);

	var votes = this.properties.votes;
// console.log(votes);
    for (var key in votes) {


	if (weighted_vote_table[key] == null) {

          weighted_vote_table[key] = votes[key] * vote_multiplier;
        } else {
          weighted_vote_table[key] += votes[key] * vote_multiplier;
        }
      
    }

  });

// console.log(weighted_vote_table);
  return weighted_vote_table;

}
