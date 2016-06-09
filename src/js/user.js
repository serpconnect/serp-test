$(function (){

	var user = window.user = {}

	user.resetPassword = function (email) {
		return window.api.ajax("POST", window.api.host + "/v1/account/reset-password", {
			email: email
		})
	}

	// requires logged in, both passwords should be in plaintext
	user.changePassword = function (oldpw, newpw) {
		return window.api.ajax("POST", window.api.host + "/v1/account/change-password", {
			old: oldpw,
			new: newpw
		})
	}

	user.self = function () {
		return window.api.ajax("GET", window.api.host + "/v1/account/self")
	}

	user.collections = function () {
		return window.api.ajax("GET", window.api.host + "/v1/account/collections")
	}

	user.invites = function () {
		return window.api.ajax("GET", window.api.host + "/v1/account/invites")
	}

	user.lookup = function (email) {
		return window.api.ajax("GET", window.api.host + "/v1/account/" + email)
	}

	user.register = function (email, passw) {
		return window.api.ajax("POST", window.api.host + "/v1/account/register", {
			email: email,
			passw: passw
		})
	}

	user.delete = function () {
		return window.api.ajax("POST", window.api.host + "/v1/account/delete")
	}

	//
	user.logout = function () {
		return window.api.ajax("POST", window.api.host + "/v1/account/logout")
	}

	// .done(() => {}), .fail(xhr => console.log(xhr.responseText))
	user.login = function (email, passw) {
		return window.api.ajax("POST", window.api.host + "/v1/account/login", {
			email: email,
			passw: passw
		})
	}

	// TODO: Get a somewhat better solution that doesn't flicker
	window.api.ajax("GET", window.api.host + "/v1/account/login")
	.done(() => $("#login").text("profile").attr("href", "/profile.html"))
})
