$(function () {
	var toProfilePage = () => window.location = "/profile.html"

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

    var inviteModal = {
        desc: "Invite user",
        message: "",
        input: [["input0", "email", "user@email.com"]],
        btnText: "invite"
    }

    $('#invite').click(evt => {
        modals.optionsModal(inviteModal, function (email) {
            api.v1.collection.invite(email, cID)
                .done(ok => {
                    modals.clearAll()
                    refresh()
                })
                .fail(xhr => alert(xhr.responseText))
        })
    })

})