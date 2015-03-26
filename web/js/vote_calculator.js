

function voteObject(data_file,project_location) {

	this.data_file = data_file;
	this.json = ( function() {
    	var json = null;
			$.ajax({
			  'async': false,
			  'global': false,
			  'url': 'data/' + data_file,
			  'dataType': "json",
			  'success': function(data) {
				json = data;
			  }
			});
			return json;
		  })();
	
	this.projectLocation = project_location;
	
	// Figure out what is the most total votes in any precinct so we can later size the pie charts accordingly
	var allTotalVotes = [];
	$.each(this.json.features, function(index, precinct) { 
	
	var thisPrecinctTotalVotes = 0;
	$.each(precinct.properties.votes, function(choice, votes) { thisPrecinctTotalVotes += votes; });
	
	allTotalVotes.push(thisPrecinctTotalVotes);
	
	});
	
	this.maxVotes = d3.max(allTotalVotes);
			

	
}


voteObject.prototype = {

computeWeights: function(weight_value) {

	this.weightValue = weight_value;

	var center_point = this.projectLocation;
		
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
		
		
	},
	
	
displayVoteTotals: function(display_div) {
	
	var html_fill = "<table>";
	var voteResultTable = this.voteResultTable;
	var total = d3.sum(d3.values(voteResultTable));

	
	for (key in voteResultTable) {

	html_fill += "<tr><td>";
    html_fill += key;
    html_fill += "</td><td>";
    html_fill += voteResultTable[key].toFixed(2);
    html_fill += " (";
	html_fill += (voteResultTable[key] / total * 100).toFixed(2);
    html_fill += "%)";
    html_fill += "</td></tr>";

  }
  	html_fill += "</table>";
		
		$(display_div).html(html_fill);
	
	},
	
		
projectVisualization: function(map_id, scale_to_fit) {
	
	// If layers exists, remove them
	if(this.projectionLayer) { map_id.removeLayer(this.projectionLayer); }
	this.projectionLayer = L.layerGroup().addTo(map_id);
	
	// Create the project markers
	L.marker(this.projectLocation, { icon: L.mapbox.marker.icon({'marker-color':'#fa0'}) } ).addTo(this.projectionLayer);
	
	// Function to build a circle at a given weight-output value
	function weightCircle(frac, weight_value) { return -1000 * ( Math.log(frac) / weight_value ); }
	
	// Create the fractional circles
	L.circle(this.projectLocation, weightCircle(0.5,this.weightValue), { fill: false, weight: 2 } ).addTo(this.projectionLayer);
	L.circle(this.projectLocation, weightCircle(0.75,this.weightValue), { fill: false, weight: 4 } ).addTo(this.projectionLayer);
	L.circle(this.projectLocation, weightCircle(0.25,this.weightValue), { fill: false, weight: 1 } ).addTo(this.projectionLayer);


	
	var maxVotes = this.maxVotes
	
	// Use Leaflet's GeoJSON layer function to build points out of this.json, passing each to the bakePie function
	this.votesLayer = L.geoJson(this.json, { pointToLayer: bakePie, onEachFeature: createPopup } );
	this.votesLayer.addTo(this.projectionLayer);
	
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
				.data(d3.layout.pie().sort(null))
			  .enter().append("svg:path")
				.attr("d", d3.svg.arc()
				.innerRadius(r/2)
				.outerRadius(r))
				.style("fill", function(d, i) { return z(i); }) //fill based on color scale
				.style("fill-opacity", feature.properties.weightValue); //set opacity to weight value

			svg = serializeXmlNode(svg) //convert svg element to code for divicon
			myIcon = new L.DivIcon({
						html: svg
					});
			return L.marker(latlng, {icon: myIcon})  
			}
			
			
			//This function creates the popup for each pie
			function createPopup(feature, layer) {
			
			var precinct = feature.properties.precinct?feature.properties.precinct:'Unnamed precinct',
				weightValue = feature.properties.weightValue?feature.properties.weightValue:1;
			
			var html = "<b>" + precinct + '</b><br>Weight: ' + weightValue.toFixed(2) + '<br><table class="popup-vote-results">';
			
			$.each(feature.properties.votes, function(choice, vote) {
			
			html += "<tr><td>" + choice + "</td><td>";
			html += vote + "</td><td>";
			html += (vote*weightValue).toFixed(2) + "</td></tr>";
			
			});
			
			html += "</table>";
			
			layer.bindPopup(html); }
			

	},
	
	
generateCanvas: function(canvas_id,width,height) { 


	var base = d3.select(canvas_id);
	var graph = base.append("canvas").attr("width",width).attr("height",height);

	var context = graph.node().getContext("2d");
	
  	for (var i = 0; i < 101; i += 1) {
  	
  		
  		var w = (i)/500;
  		this.computeWeights(w);
  		
  		var z = 100/width;
  		var x = i / z;
  		
  		var h = 0;
  		var m = 0;
  		var c = ["#669900","#FF0000","#FFFF66"]; //colors

  		
  		var total = d3.sum(d3.values(this.voteResultTable));

		$.each(this.voteResultTable, function(choice, vote) {
		context.beginPath();
		context.moveTo(x,h);
  		h += vote/total*height;
  		context.lineTo(x, h);
  		context.lineWidth=Math.floor(1/z);
  		context.strokeStyle=c[m];
  		context.stroke();
  		m += 1;

  		});
  		
  		context.beginPath();
		context.moveTo(0,Math.floor(height/2)+0.5);
		context.lineTo(width+1,Math.floor(height/2)+0.5);
		context.lineWidth=1;
		context.strokeStyle="#ccc";
		context.stroke();
  		
  	}

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


