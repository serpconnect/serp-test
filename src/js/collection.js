$(function () {

	var toProfilePage = () => window.location = "/profile.html"

	// Only allow user to inspect specific collection
	if (window.location.hash.length === 0)
		toProfilePage()

	// http://serpconnect.cs.lth.se/collection.html#33 => 33
	var cID = window.location.hash.substring(1)

	function updateLink(el) {
		el.setAttribute('href', `${el.getAttribute('href')}#${cID}`)
	}

	['general', 'users', 'entries'].forEach(id => updateLink(document.getElementById(id)))

	window.api.v1.account.collections()
		.done(collections => collections.forEach(collection => {
			if (collection.id === Number(cID))
				setupName(collection)
		}))
		.fail(toProfilePage)

	window.api.v1.collection.stats(cID)
		.done(setupStats)
		.fail(toProfilePage)

	function setupName(collection) {
		$('#name').text(collection.name)
		$('#id').text(collection.id)
	}

	/* X member(s), Y entr(y|ies) */
    function formatStats(members, entries) {
        var mems = members === 1 ? "member" : "members"
        var entr = entries === 1 ? "entry" : "entries"

        return `${members} ${mems}, ${entries} ${entr}`
    }

	function setupStats(stats) {
		$('.collection-stats').text(formatStats(stats.members, stats.entries))
	}

    // Create leave collection modal
	document.getElementById('leave').addEventListener('click', (evt) => {
		var title = `${$('#name').text()} (#${cID})`
		window.modals.confirmPopUp(`Leave ${title}?`, () => {
			window.api.v1.collection.leave(cID).always(toProfilePage)
		})
  }, false)

	document.getElementById('export').addEventListener('click', (evt) => {
		var cName = document.getElementById("name").innerText;
		window.export.toFile(cID, cName);
	}, false)

})
