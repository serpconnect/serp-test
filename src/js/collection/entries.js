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

	function refresh() {
		window.api.ajax("GET", window.api.host + "/v1/collection/" + cID + "/entries")
			.done(setupEntries)
			.fail(toProfilePage)
	}

	refresh()

	function setupEntries(entries) {
		var elEntries = document.getElementById('collection-entries')

		while (elEntries.firstChild)
			elEntries.removeChild(elEntries.firstChild)

		entries.forEach(entry => {
			var elEntry = el('div.collection-option-li', {
				'data-entry-id': entry.id
			}, [entry.description || entry.reference || entry.DOI])

			elEntry.addEventListener('click', inspectEntry, false)

			elEntries.appendChild(elEntry)
		})
	}

	var reverseMap = {
    	"adapting": "Effect",
        "solving": "Effect",
        "assessing": "Effect",
        "improving": "Effect",
        "planning": "Scope",
        "design": "Scope",
        "execution": "Scope",
        "analysis": "Scope",
        "people": "Context",
        "information": "Context",
        "sut" : "Context",
        "other": "Context"
    }
    var shorthandMap = {
        "adapting": "Adapt testing",
        "solving": "Solve new problem",
        "assessing": "Assess testing",
        "improving": "Improve testing",
        "planning": "Test planning",
        "design": "Test design",
        "execution": "Test execution",
        "analysis": "Test analysis",
        "people": "People related constraints",
        "information": "Availability of information",
        "sut" : "Properties of SUT",
        "other": "Other"
    }

	function inspectEntry(evt) {
		var id = this.dataset.entryId

		function removeFromCollection() {
            toggleButtonState()
			window.api.ajax("POST", window.api.host + "/v1/collection/" + cID + "/removeEntry", {
				entryId: id
			})
				.done(() => {
					document.body.removeChild(modal)
					refresh()
				})
				.fail(xhr => alert(xhr.responseText))
		}

        var removeBtn = el("button.btn", ["remove from collection"])
        removeBtn.addEventListener('click', removeFromCollection, false)

		window.api.ajax("GET", window.api.host + "/v1/entry/" + id).done(entry => {
			window.api.ajax("GET", window.api.host + "/v1/entry/" + id + "/taxonomy").done(taxonomy => {
				modals.entryModal(cID,entry, taxonomy, {
                    button: [removeBtn]
				})
			})
		})
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


})
