$(document).ready(function() {

	var info = window.info = {}

	info.taxonomyInfo = function(label){
		switch (label) {
		/* root node */
		case 'serp':
			return ['Click the tables on the left to get more information about the facets.',0]
		case 'intervention':
			return ['Characteristics of possible solutions.',0]
		case 'scope':	
			return ['Scope of an effect or an effect target.',0]
		case 'planning':
		case 'design':
		case 'execution':
		case 'analysis':
			return ['Scope lorum ipsum', 'scope']
		case 'context':
			return ['Factors in the context affecting the applicability of an intervention.',0]
		case 'other':
		case 'sut':
		case 'information':
		case 'people':
			return ['context Laurence Ipsum', 'context']
		case 'effect':
			return ['Effect targets, or measured effects of an intervention.',0]
		case 'adapting':
		case 'solving':
		case 'assessing':
		case 'improving':
			return ['effect lorum Ipsum', 'effect']
		
		default:
			return 
		}
	}

})
