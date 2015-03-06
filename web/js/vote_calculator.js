

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
	
	this.weightedJson = $.extend(true,{},this.json);
	this.voteResultTable = {};
	
// 	console.log(this.json);
// 	console.log(this.voteResultTable);
	
	
	for(precinct in this.weightedJson.features) { 

		weighter = calculateWeightMultiplier( this.weightedJson.features[precinct].geometry.coordinates, center_point, weight_value );
		
			for( vote in this.weightedJson.features[precinct].properties.votes ) {
			
				weighted_vote = this.weightedJson.features[precinct].properties.votes[vote] * weighter;
				this.weightedJson.features[precinct].properties.votes[vote] = weighted_vote;
				
				if( this.voteResultTable[vote] == null ) {
					
					this.voteResultTable[vote] = weighted_vote;
					
				} else {
				
					this.voteResultTable[vote] += weighted_vote;
				
				}
				
				}
		
		}
		
	
	
	
	
		
	},
	
	
	displayVoteTotals: function(display_div) {
	
	var html_fill = "";
	var voteResultTable = this.voteResultTable;
	
	for (key in voteResultTable) {

    html_fill += key;
    html_fill += ":";
    html_fill += voteResultTable[key];
    html_fill += " (";
//     html_fill += voteResultTable[key]/total_votes * 100;
    html_fill += "%)";
    html_fill += "<br>";

  }
		
		$(display_div).html(html_fill);
	
	}
	
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



