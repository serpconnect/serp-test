$(function () {
	window.api = {
		host: "http://api.serpconnect.cs.lth.se",
		ajax: function (method, url, data) {
			return $.ajax(url, {
				method: method,
				data: data,
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true
			})
		},
		json: function (method, url, data) {
			return $.ajax(url, {
				method: method,
				data: JSON.stringify(data),
				contentType: "application/json",
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true
			})
		}
	}
})