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

	window.api.v1.account.collections()
		.done(collections => collections.forEach(collection => {
			if (collection.id === Number(cID))
				setupName(collection)
		}))
		.fail(toProfilePage)

	window.api.ajax("GET", window.api.host + "/v1/collection/" + cID + "/stats")
		.done(setupStats)
		.fail(toProfilePage)

	function setupName(collection) {
		var elName = $('#name').text(collection.name)
		var elID = $('#id').text(collection.id)
	}

	function setupStats(stats) {
		var elStats = $('.collection-stats').text(
			`${stats.members} user${stats.members > 1 ? 's' : ''}, ${stats.entries} entr${stats.entries > 1 ? 'ies' : 'y'}`)
	}

	function leave() {
        var confirm = el('button.btn', ['leave'])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", [$('#name').text()]),
            el("div.modal-divider"),
            el("div.modal-sub-item", ['Leave collection?']),
            el("div.modal-divider"),
            confirm, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        confirm.addEventListener('click', (evt) => {
            confirm.classList.add('submit-disabled')
            cancel.classList.add('submit-disabled')
            confirm.setAttribute('disabled', true)
            cancel.setAttribute('disabled', true)
            window.api.ajax("POST", window.api.host + "/v1/collection/" + cID + "/leave")
            	.always(toProfilePage)
        })

        document.body.appendChild(modal)
    }

	document.getElementById('logout').addEventListener('click', leave, false)
})