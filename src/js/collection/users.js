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
		window.api.ajax("GET", window.api.host + "/v1/collection/" + cID + "/members")
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

	function invite(evt) {
        var send = el('button.btn', ['send'])
        var cancel = el('button.btn', ['cancel'])
        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", ["send invite"]),
            el("div.modal-divider"),
            el('input#email.submit-input-box', {
                placeholder : 'user email',
                type : 'email',
                name : 'email'
            }),
            el("div.modal-divider"),
            send, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        send.addEventListener('click', (evt) => {
            toggleButtonState()

            window.api.ajax("POST", window.api.host + "/v1/collection/" + cID + "/invite", {
                email: $('#email').val(),
            })
                .done(ok => {
                    document.body.removeChild(modal)
                    refresh()
                })
                .fail(xhr => {
                    $('.complaint').remove()
                    var div = document.getElementById('name')
                    div.parentNode.insertBefore(el('div.complaint', [
                        xhr.responseText
                    ]), div.nextSibling)
                    toggleButtonState()
                })
        }, false)

        document.body.appendChild(modal)
        modal.querySelector('input').focus()
    }

    // Switch all buttons between disabled and enabled state
    function toggleButtonState() {
        var btns = document.querySelectorAll('.btn')
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('submit-disabled')
            if (btns[i].getAttribute('disabled'))
                btns[i].removeAttribute('disabled')
            else
                btns[i].setAttribute('disabled', true)

        }
    }

    document.addEventListener('keydown', function (evt) {
        if (evt.keyCode === 27) {
            var modal = document.querySelector('.modal')
            if (!modal) return
            document.body.removeChild(modal)
        }
    })

    window.addEventListener('load', () => {
        document.body.addEventListener('click', function (evt) {
            if (evt.target.className === "modal")
                document.body.removeChild(evt.target)
        }, false)
    })

    $('#logout').click(invite)

})