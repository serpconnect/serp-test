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

	function leave() {
        var confirm = el('button.btn', ['leave'])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [
			el('div', [
				el("div.modal-header-title", [$('#name').text()]),
				el("div.modal-divider"),
				el("div.modal-sub-item", ['Leave collection?']),
				el("div.modal-divider"),
				confirm, cancel
        	])
		])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        confirm.addEventListener('click', (evt) => {
            confirm.classList.add('submit-disabled')
            cancel.classList.add('submit-disabled')
            confirm.setAttribute('disabled', true)
            cancel.setAttribute('disabled', true)
            window.api.v1.collection.leave(cID).always(toProfilePage)
        })

        document.body.appendChild(modal)
    }

	document.getElementById('leave').addEventListener('click', leave, false)
})