$(document).ready(function() {

	var info = window.info = {}

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
})