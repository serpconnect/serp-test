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

	user.resetpassword = function(passw){
		return window.api.ajax("POST", window.api.host + "/v1/account/reset-password-confirm", {
			passw: passw
		})
	}


	// Logout user when logout button is clicked
    $("#logout").click(evt => window.user.logout().done(toHome))

    //logout to home page
    function toHome() {
    	window.location = "/"
    }

    // TODO: Make "log in or sign up" link disappear on login page
 //    if (window.location.pathname=="/login") {
 //   		$("#logout").hide();//.style.display = 'hidden';
	// }

	// TODO: Get a somewhat better solution that doesn't flicker
	//#logout is the id for both login/signup + logout
	window.api.ajax("GET", window.api.host + "/v1/account/login")
	.done(() => $("#logout").text("logout").attr("href", "/"))
})
