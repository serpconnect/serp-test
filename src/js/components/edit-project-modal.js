(function (G) {

	function updateError(modal, error) {
		var existing = modal.querySelectorAll('.modal-complaint')
		for (var i = 0; i < existing.length; i++)
			existing[i].parentNode.removeChild(existing[i])

		var buttons = modal.querySelectorAll('button')
		var lastBtn = buttons[buttons.length - 1]

		var complaint = el('div.modal-complaint', [error])
		lastBtn.parentNode.insertBefore(complaint, lastBtn.nextSibling)
	}

	G.editProjectModal = function (project) {
		var update = el('button#confirm.btn', ['update'])
		var projectName = el('input.modal-input-box', {
			value: project.name
		})

		var set_serp_btn = el('button.btn', ['set serp taxonomy'])
		var set_test_btn = el('button.btn', ['set serp-test taxonomy'])

		var projectLink = el('input.modal-input-box', {
			value: project.link
		})

		var modal = el('div#modalConf.modal.confirm.appear', [
			el('div', [
				window.modals.closeButton(),
				el("div.modal-header-title", ['Edit project']),
				el('div.modal-divider'),
				el('div', [
					el('label.w-3em', ['name']),
					projectName
				]),
				el('div', [
					el('label.w-3em', ['link']),
					projectLink,
				]),
				el('div.modal-divider'),
				set_serp_btn,
				el("div#bottom-divider.modal-divider"),
				update,
				window.modals.cancelButton()
			])
		])
		return new Promise(function (F, R) {
			set_serp_btn.addEventListener('click', evt => {
				window.modals.toggleButtonState()
				var serpTaxonomy = new window.Taxonomy()
				serpTaxonomy.root.addChild(new FacetNode("effect", "Effect", [], ""))
				serpTaxonomy.root.addChild(new FacetNode("intervention", "Intervention", [], ""))
				serpTaxonomy.root.addChild(new FacetNode("scope", "Scope", [], ""))				
				serpTaxonomy.root.addChild(new FacetNode("context", "Context", [], ""))
				var data = {
					taxonomy: serpTaxonomy.root.flatten(),
					version: 1
				}
				api.v1.project.taxonomy(project.name, data)
					.done(() => {
						document.body.removeChild(modal)
						F()
					}).fail(xhr => {
						updateError(modal, xhr.responseText)
					}).always(window.modals.toggleButtonState())
			})

			update.addEventListener('click', evt => {
				var updatedNameOrLink = {}
				updateNameOrLink = false

				if (projectName.value !== project.name) {
					updatedNameOrLink.name = projectName.value
				}

				if (projectLink.value !== project.link) {
					updatedNameOrLink.link = projectLink.value
				}

				var updateNameOrLink = Object.keys(updatedNameOrLink).length > 0
				if (!updateNameOrLink) {
					updateError(modal, "Nothing to update")
					return
				}

				window.modals.toggleButtonState()
				api.v1.project.update(project.name, updatedNameOrLink)
					.done(() => {
						document.body.removeChild(modal)
						F()
					}).fail(xhr => {
						updateError(modal, xhr.responseText)
					}).always(window.modals.toggleButtonState())
			})

			document.body.appendChild(modal)
		})
	}

})(window.components || (window.components = {}));