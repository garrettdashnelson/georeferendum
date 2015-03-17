

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
	
	// Create blank voteResultTable object to hold tallied results
	this.voteResultTable = {};

	// Loop through features json object		
	for(precinct in this.json.features) { 

		// Calculate weight based on distance and passed weight_value
		weighter = calculateWeightMultiplier( this.json.features[precinct].geometry.coordinates, center_point, weight_value );
		
		// Create properties.weightValue variable for feature
		this.json.features[precinct].properties.weightValue = weighter;
		
			// Compute each vote amount and add to voteResultTable for tally
			for( vote in this.json.features[precinct].properties.votes ) {
			
				weighted_vote = this.json.features[precinct].properties.votes[vote] * weighter;
				
				if( this.voteResultTable[vote] == null ) { this.voteResultTable[vote] = weighted_vote; }
				else { this.voteResultTable[vote] += weighted_vote; }
				
		} }
		
	// Figure out what is the most total votes in any precinct so we can size the pie charts
	var allTotalVotes = [];
	$.each(this.json.features, function(index, precinct) { 
	
	var thisPrecinctTotalVotes = 0;
	$.each(precinct.properties.votes, function(choice, votes) { thisPrecinctTotalVotes += votes; });
	
	allTotalVotes.push(thisPrecinctTotalVotes);
	
	});
	
	this.maxVotes = d3.max(allTotalVotes);
			
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
	
	},
	
		
	projectVisualization: function(map_id, scale_to_fit) {
	
	// If there's already a pie chart layer, remove it
	if(this.votesLayer) { map_id.removeLayer(this.votesLayer); }
	var maxVotes = this.maxVotes
	
	// Use Leaflet's GeoJSON layer function to build points out of this.json, passing each to the bakePie function
	this.votesLayer = L.geoJson(this.json, { pointToLayer: bakePie, onEachFeature: createPopup } );
	
	this.votesLayer.addTo(map_id);
	
	// Scale the Leaflet map to fit all the points unless we've passed false flag
	if(scale_to_fit != false) { map_id.fitBounds(this.votesLayer.getBounds()); }

			//This function builds the SVG for our pies
			function bakePie(feature, latlng) {
			
			var thisPrecinctVotes = 0;
			$.each(feature.properties.votes, function(choice, votes) { thisPrecinctVotes += votes; } );
			
			
			var m = 2, //margin
			r = Math.sqrt(thisPrecinctVotes/maxVotes)*30, //radius of circles
			width = (r+m)*2,
			height = (r+m)*2,
			z = d3.scale.ordinal().range(["#669900","#FF0000","#FFFF66"]); //colors

			dump =[];
			$.each(feature.properties.votes, function(choice, vote) { dump.push( vote ); });

			var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');

			var vis = d3.select(svg) //create an svg object
				.data([dump])
				.attr("width", width)
				.attr("height", height)
			  .append("svg:g")
				.attr("transform", "translate(" + (r + m) + "," + (r + m) + ")"); 

			vis.selectAll("path")
				.data(d3.layout.pie().sort(null) )
			  .enter().append("svg:path")
				.attr("d", d3.svg.arc()
				.innerRadius(r/2)
				.outerRadius(r))
				.style("fill", function(d, i) { return z(i); }) //fill based on color scale
				.style("fill-opacity", feature.properties.weightValue); //set opacity to weight value
			//svg = document.getElementsByTagName("svg")[0]
			svg = serializeXmlNode(svg) //convert svg element to code for divicon
			myIcon = new L.DivIcon({
						html: svg
					});
			return L.marker(latlng, {icon: myIcon})  
			}
			
			
			//This function creates the popup for each pie
			function createPopup(feature, layer) { layer.bindPopup(feature.properties.precinct); }
			




	}
	
	

	
}






function serializeXmlNode(xmlNode) {
    if (typeof window.XMLSerializer != "undefined") {
        return (new window.XMLSerializer()).serializeToString(xmlNode);
    } else if (typeof xmlNode.xml != "undefined") {
        return xmlNode.xml;
    }
    return "";
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


