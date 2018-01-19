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
			'planning':{
				description: 'Decisions on testing and how to achieve the testing goal.'
			},
			'design':{
				 description: 'Activities related to deriving and creating test cases and test sets.'
			},
			'execution':{
				 description: 'Test scripting, execution and verdict reporting of test case and set.'
			},
			'analysis':{
				 description: 'Evaluation and analysis of the test outcome with respect to some criteria.'
			},
			'context':{
				 description: 'Factors in the context affecting the applicability of an intervention.'
			},
			'other':{
				description:'Other context factors.'
			},
			'sut': {
				description:'Properties of the System Under Test, such as system scale.'
			},
			'information':{
				description:'Process- and intervention-related context factors, such as available information and specifications.'
			},
			'people':{
				description:'People-related context factors, such as knowledge and experience.'
			},
			'effect':{
				description:'Effect targets, or measured effects of an intervention.'
			},
			'adapting':{
				description: 'Adapt testing to a new or changed testing context.'
			},
			'solving':{
				description: 'Solve a new testing problem.'
			},
			'assessing':{
				description: 'Assess test intervention, such as effectiveness and quality.'
			},
			'improving': {
				description: 'Improve metrics of current testing, such as effectiveness and dependability.'
			}
		}
	
		info.getInfo = function (label) {
			//ise object instead of label
			 var data = taxonomyInfo[label]
			 if (data) return data
			 else return { description: "This facet is not yet formally described." }
		}
	})