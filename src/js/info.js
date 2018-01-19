$(document).ready(function() {

	/**
	 * This file describes each facet. Every project website needs to update this file so
	 * that it matches the taxonomy. Currently only overview graph uses this information.
	 */

	var info = window.info = {}

	var taxonomyInfo = {
	 	'root':{
		 	description: 'Click the tables on the left to get more information about the facets.'
		},
		'intervention': {
			description: 'Characteristics of possible solutions.'
		},
		'scope': {
			description: 'Scope of an effect or an effect target.'
		},
		'context':{
		 	description: 'Factors in the context affecting the applicability of an intervention.'
		},
		'effect':{
			description:'Effect targets, or measured effects of an intervention.'
		},
	}

	info.getInfo = function (label) {
		//ise object instead of label
    	var data = taxonomyInfo[label]
    	if (data) return data
    	else return { description: "This facet is not yet formally described." }
	}
})