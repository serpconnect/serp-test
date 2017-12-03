$(document).ready(function() {

	var info = window.info = {}

<<<<<<< HEAD
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
=======
	var taxonomyInfo = {
	 	'serp':{
		 	description: 'Click the tables on the left to get more information about the facets.'
		},
		'intervention': {
			description: 'Characteristics of possible solutions.'
		},
		'scope': {
			description: 'Scope of an effect or an effect target.'
		},
		'planning':{
			description: 'Scope lorum ipsum'
		},
		'design':{
		 	description: 'Scope lorum ipsum'
		},
		'execution':{
		 	description: 'Scope lorum ipsum'
		},
		'analysis':{
		 	description: 'Scope lorum ipsum'
		},
		'context':{
		 	description: 'Factors in the context affecting the applicability of an intervention.'
		},
		'other':{
			description:'context Laurence Ipsum'
		},
		'sut': {
			description:'context Laurence Ipsum'
		},
		'information':{
			description:'context Laurence Ipsum'
		},
		'people':{
			description:'context Laurence Ipsum'
		},
		'effect':{
			description:'Effect targets, or measured effects of an intervention.'
		},
		'adapting':{
			description: 'effect lorum Ipsum'
		},
		'solving':{
			description: 'effect lorum Ipsum'
		},
		'assessing':{
			description: 'effect lorum Ipsum'
		},
		'improving': {
			description: 'effect lorum Ipsum'
		}
	}

	info.getInfo = function (label) {
		//ise object instead of label
    	var data = taxonomyInfo[label]
    	if (data) return data
    	else return { description: "Space Pirates took your desciprtion" }
	}
>>>>>>> 703dc3f
})