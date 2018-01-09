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

	G.createProjectModal = function () {
		var create = el('button#confirm.btn', ['create'])
		var projectName = el('input.modal-input-box', {
			placeholder: 'project name'
		})

		var projectLink = el('input.modal-input-box', {
			placeholder: 'project home page'
		})

		var modal = el('div#modalConf.modal.confirm.appear', [
			el('div', [
				window.modals.closeButton(),
				el("div.modal-header-title", ['Create new project']),
				el('div.modal-divider'),
				projectName,
				projectLink,
				el("div#bottom-divider.modal-divider"),
				create,
				window.modals.cancelButton()
			])
		])

		return new Promise(function (F, R) {
			create.addEventListener('click', evt => {
				if (!projectName.value) {
					updateError(modal, "Must provide a name")
					return
				}

				if (!projectLink.value) {
					updateError(modal, "Must provide a home page")
					return
				}

				window.modals.toggleButtonState()
				api.v1.project.create(projectName.value, projectLink.value)
                	.done(data => {
                		document.body.removeChild(modal)
                		F({
	                		link: projectLink.value,
	                		name: projectName.value
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