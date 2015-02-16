# coding=utf-8

import math
import json


# A function that computes the distance between two points
# Based off code from John D. Cook, http://www.johndcook.com/python_longitude_latitude.html

def computeSphericalDistance(vote_loc,proj_loc):
	
    degrees_to_radians = math.pi/180.0
        
    phi1 = (90.000 - proj_loc["Lat"])*degrees_to_radians
    phi2 = (90.000 - vote_loc["Lat"])*degrees_to_radians
        
    theta1 = proj_loc["Lon"]*degrees_to_radians
    theta2 = vote_loc["Lon"]*degrees_to_radians
    
    cos = (math.sin(phi1)*math.sin(phi2)*math.cos(theta1 - theta2) + math.cos(phi1)*math.cos(phi2))
    arc = math.acos( cos )

	# Return in kilometers
    return arc * 6371

  

# A function that takes a number of votes a given distance from a project and weights them

def computeVoteWeight(dist,vote,decay_constant):

	weighter = math.e ** ( dist * decay_constant * -1)
	return vote * weighter

	



decay_weight = raw_input('➔ What should the decay weight of the function be? (Default: 0.03): ')

if ( decay_weight == "" ) :
	decay_weight = 0.03
else :
	decay_weight = float(decay_weight)
	

precincts_table = raw_input('➔ What is the name of the precincts file? (Default: precincts.json): ')

if ( vote_table == "" ) :
	vote_table = "precincts.json"
	
	

vote_table = raw_input('➔ What is the name of the vote tally file? (Default: votes.json): ')

if ( vote_table == "" ) :
	vote_table = "votes.json"
	
proj_lat = ''
while not proj_lat:
	proj_lat = raw_input('➔ What is the decimal latitude of the project in question?: ')

proj_lat = float(proj_lat)


proj_lon = ''
while not proj_lon:
	proj_lon = raw_input('➔ What is the decimal longitude of the project in question?: ')

proj_lon = float(proj_lon)

proj_loc = { "Lat" : proj_lat, "Lon": proj_lon }


tabulator = { }
	


try:
	vt = open ( vote_table )
except IOError:
	print( "File opening failed! Make sure you've entered the correct file name." )


entries = csv.DictReader( vt )

for row in entries:

	vote_loc = { "Lat" : float(row["vote_loc_lat"]), "Lon": float(row["vote_loc_lon"]) }
	dist = computeSphericalDistance ( vote_loc, proj_loc ) 
	number_votes = float(row["total_votes"])
	
	weighted_vote = computeVoteWeight( dist, number_votes, decay_weight )
	
	try:
		tabulator[ row["vote_choice"] ]
	except KeyError:
		tabulator[ row["vote_choice" ] ] = weighted_vote
	else:
		tabulator[ row["vote_choice" ] ] = tabulator[ row["vote_choice" ] ] + weighted_vote
		
for choice, count in tabulator.items():
	print str(choice) + '\t\t' + str(count)

