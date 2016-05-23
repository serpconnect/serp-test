const jsdom = require('jsdom')
module.exports = function (url, callb) {
	jsdom.env({
	    url: url,
	    features: {
	        FetchExternalResources: ['script'],
	        ProcessExternalResources: ['script']
	    },
	    done: function (error, window) {
	    	if (error) throw `Unexpected jsdom error ${error}`
	    	callb(window)
	    }
	})
}