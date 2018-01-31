(function (G) {

	function updateError(modal, error) {
		var existing = modal.querySelectorAll('.modal-complain')
		while (existing.length)
			modal.removeChild(existing.pop())

		var buttons = modal.querySelectorAll('button')
		var lastBtn = buttons[buttons.length - 1]

		var complaint = el('div.modal-complaint', [error])
		lastBtn.parentNode.insertBefore(complaint, lastBtn.nextSibling)
	}

	G.createCollectionModal = function () {
		var create = el('button#confirm.btn', ['create'])
		var collectionName = el('input.modal-input-box', {
			placeholder: 'collection name'
		})
		var modal = el('div#modalConf.modal.confirm.appear', [
			el('div', [
				window.modals.closeButton(),
				el("div.modal-header-title", ['Create new collection']),
				el('div.modal-divider'),
				collectionName,
				el("div#bottom-divider.modal-divider"),
				create,
				window.modals.cancelButton()
			])
		])

		return new Promise(function (F, R) {
			create.addEventListener('click', evt => {
				if (!collectionName.value) {
					updateError(modal, "Must provide a name")
					return
				}

				window.modals.toggleButtonState()
				api.v1.collection.create(collectionName.value)
                	.done(data => {
                		document.body.removeChild(modal)
                		F({
	                		id: data.id,
	                		name: collectionName.value
                		})
                	})
	                .fail(xhr => {
	                	window.modals.toggleButtonState()
						updateError(modal, xhr.responseText)
					})
			})

			document.body.appendChild(modal)
		})
	}
})(window.components || (window.components = {}));
/*
(function (G) {

	function updateError(modal, error) {
		var existing = modal.querySelectorAll('.modal-complain')
		while (existing.length)
			modal.removeChild(existing.pop())

		var buttons = modal.querySelectorAll('button')
		var lastBtn = buttons[buttons.length - 1]

		var complaint = el('div.modal-complaint', [error])
		lastBtn.parentNode.insertBefore(complaint, lastBtn.nextSibling)
	}

	G.createCollectionModal = function () {
		var create = el('button#confirm.btn', ['create'])
		var collectionName = el('input.modal-input-box', {
			placeholder: 'collection name'
		})
		var modal = el('div#modalConf.modal.confirm.appear', [
			el('div', [
				window.modals.closeButton(),
				el("div.modal-header-title", ['Create new collection']),
				el('div.modal-divider'),
				collectionName,
				el("div#bottom-divider.modal-divider"),
				create,
				window.modals.cancelButton()
			])
		])

		return new Promise(function (F, R) {
			create.addEventListener('click', evt => {
				if (!collectionName.value) {
					updateError(modal, "Must provide a name")
					return
				}
				window.modals.toggleButtonState()
				var cID 
        		var projectName = 'serp-test'
        		var projectBaseLink = 'http://localhost:8182/'

				api.v1.collection.create(collectionName.value)
                	.done(data => {
                		cID = data.id
                		F({
	                		id: cID,
	                		name: collectionName.value
                		})
                		//work around to create collections with unique taxonomies
                		api.v1.project.create(projectName + cID, projectBaseLink + cID)
	                	.done(data => {
	                		document.body.removeChild(modal)
	                		F({
		                		link: projectBaseLink + cID,
		                		name: projectName + cID
	                		})

	                		
		        			var taxonomyData 
							api.v1.project.taxonomy(projectName).then(serp => {	
								var taxonomy = new window.Taxonomy(serp.taxonomy)
								taxonomyData = {
							    	taxonomy: taxonomy.root.flatten(),
							    	version: 1
							    }
							    taxonomyData.taxonomy.splice(0, 1) // remove 'root' node
							})
							
							api.v1.project.taxonomy( projectName + cID, taxonomyData).then(() => {
							    	console.log("ok")
							    }).fail(xhr => alert(xhr.responseText))
						
				            api.v1.project.taxonomy( projectName + cID, taxonomyData).then(() => {
							    	console.log("ok")
							    }).fail(xhr => alert(xhr.responseText))
							    
					    	})


	                	})
                		.fail(xhr => {
						updateError(modal, xhr.responseText)
						}).always(() => {
		                	window.modals.toggleButtonState()
		                }).then( function() {
		                
		                
						// need to add to delete collection modal too
                	})
	                .fail(xhr => {
	                	window.modals.toggleButtonState()
						updateError(modal, xhr.responseText)
					})


			})

			document.body.appendChild(modal)
		})
	}

})(window.components || (window.components = {}));*/