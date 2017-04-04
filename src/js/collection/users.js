$(function () {
	var toProfilePage = () => window.location = "/profile.html"
	var collectionName;
	var friends =[]
	var userEmail = "undefined"

	// Only allow user to inspect specific collection
	if (window.location.hash.length === 0)
		toProfilePage()

	// http://serpconnect.cs.lth.se/collection.html#33
	var cID = window.location.hash.substring(1)

	function updateLink(el) {
		el.setAttribute('href', `${el.getAttribute('href')}#${cID}`)
	}

	['general', 'users', 'entries'].forEach(id => updateLink(document.getElementById(id)))

	function refresh(){
		api.v1.collection.members(cID, "all")
            .done(setupMembers)
			.fail(toProfilePage)
	}

	refresh()

	function setupMembers(members) {
		$('#members')
			.empty()
			.append(members.map(member => {
				return $('<div>').addClass('')
					.data('user-email', member.email)
					.data('user-id', member.id)
					.append([
						$('<span>').addClass('').text(member.email),
				])
			}))
	}	

   	function inviteUser(evt) {
	    var inviteModal = {
	        desc: "Invite user to " + collectionName,
	        message: "",
	        input: [["input0", "email", "user@email.com"]],
	        btnText: "invite"
	    }
        modals.optionsModal(inviteModal, function (email) {
            api.v1.collection.invite(email, cID)
                .done(ok => {
                    modals.clearAll()
                    refresh()
                })
                .fail(xhr => alert(xhr.responseText))
        })
		new Awesomplete('#input0', { 
				list: friends, 
				filter: ausomplete.autocompleteFilter, 
				replace: ausomplete.autocompleteUpdate
		})
    }

	function kickUser(evt) {
		api.v1.collection.members(cID, "all").done(members => {
			var emails = members.map(user => user.email)
			emails.splice(emails.indexOf(userEmail), 1)

			var kickUserModal = {
				desc: "Kick user from " + collectionName,
				message: "",
				list: emails,
				input: [['input0', 'email', 'user email']],
				btnText: "Kick"
			}

			//fix alternatives so only people in the collection shows up
			window.modals.fuzzyModal(kickUserModal, function (email) {
				window.modals.confirmKickPopUp(`Are you sure you want to kick ${email}?`, () => {
					api.v1.collection.kick(email, id)
						.done(ok => cleanup(this.modal))
						.fail(xhr => complain(xhr.responseText))
				})

			})


			new Awesomplete('#input0', {
				list: emails,
				filter: ausomplete.autocompleteFilter,
				replace: ausomplete.autocompleteUpdate
			})
		})
	}

    window.api.v1.account.self()
        .then(function (self) {
			userEmail = self.email
    		return window.api.v1.account.friends(self.email)
		}).then(function (myFriends) {
			friends = myFriends
			return window.api.v1.account.collections()
		}).then(function (collections) {
			collections.forEach(collection => {
				if (collection.id === Number(cID)){
					collectionName = collection.name
				}
			})
			return window.api.v1.collection.isOwner(cID)
		}).then(function (owner) {
			if (!owner)
				return
			$('.user-options').append(
				$('<button>').addClass('btn').text('kick user').click(kickUser)
			).append(
				$('<button>').addClass('btn').text('invite user').click(inviteUser)
			)
		})
        .fail(toProfilePage)

})