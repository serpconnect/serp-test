$(function () {
	var isOwner;
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
		.then(collections => {
      		return collections.filter(collection => {
        		return collection.id === Number(cID)
      		}).pop()
    }).then(collection => {
		if (!collection) throw new Error("You are not a member of this collection")
		setupName(collection)
		return api.v1.collection.isOwner(collection.id)
    }).then(owner =>{
		isOwner=owner;
		$('#owner').text(owner ? " (owner)" : "")
		$('#leave').text(owner ? "delete collection" : "leave collection")
    }).fail(reason => {
		window.alert(reason)
	})

	window.api.v1.collection.stats(cID)
		.done(setupStats)
		.fail(toProfilePage)

	function setupName(collection) {
		$('#name').text(collection.name)
		$('#id').text(collection.id)
	}

	function getCollectionName(){
		return $('#name').text()
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
		window.components.leaveCollectionModal(cID, isOwner)
			.then(toProfilePage)
  }, false)

	document.getElementById('export').addEventListener('click', (evt) => {
		var cName = document.getElementById("name").innerText;
		window.export.toFile(cID, cName);
	}, false)

	document.getElementById('presentation').addEventListener('click', (evt) => {
        window.location = window.location.origin + "/presentation.html#" + cID
    })

})
