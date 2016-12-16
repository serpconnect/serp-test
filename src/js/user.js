$(function (){

	var user = window.user = {}

    user.resetPassword = window.api.v1.account.resetPassword
    user.changePassword = window.api.v1.account.changePassword
    user.self = window.api.v1.account.self
    user.collections = window.api.v1.account.collections
    user.createCollection = window.api.v1.collection.create
    user.collectionInvite = window.api.v1.collection.invite

	user.putIntoCollection = function(url, eID){
		return window.api.ajax("POST", url, { entryId: eID })
	}

	user.collectionUrl = window.api.v1.collection.url
	user.invites = window.api.v1.account.invites
	user.friends = window.api.v1.account.friends
	user.lookup = window.api.v1.account.lookup
	user.register = window.api.v1.account.register
	user.delete = window.api.v1.account.delete
	user.logout = window.api.v1.account.logout
	user.login = window.api.v1.account.login
	user.resetpassword = window.api.v1.account.confirmNewPassword
	user.getEntry = window.api.v1.getEntry
	user.getTaxonomyEntry = window.api.v1.getTaxonomyEntry

	// Logout user when logout button is clicked
    function logout() {
        api.v1.account.logout().done(ok => window.location = "/")
    }

    $("#logout").click(logout)


    function loggedIn() {
        $("#logout").text("logout").attr("href", "/")
        $("#profile").text("profile").attr("href", "/profile.html")
    }

	// TODO: Get a somewhat better solution that doesn't flicker
	//#logout is the id for both login/signup + logout
	api.v1.account.loggedIn().done(loggedIn)
})
