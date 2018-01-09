$(function() {
	var user_data = undefined

	document.getElementById('projects').classList.add('current-view')

	function delete_project(evt) {
		var row = this.parentNode.parentNode // tr > td > btn
		var name = row.dataset.projectName

		window.alert('not yet implemented')
	}

	function create_new_project(evt) {
		window.components.createProjectModal().then(reload)
	}

	function create_project_row(project, is_admin) {
		var delete_btn = el('button', ['delete'])
		delete_btn.addEventListener('click', delete_project, false)

		return el('tr', { 'data-project-name': project.name }, [
			el('td', [project.name]),
			el('td', [
				el('a', {href:project.link},
					[project.link])
			]),
			el('td', [
				is_admin ? delete_btn : undefined
			])

		])
	}

	function load_projects() {
		var is_admin = user_data.trust === 'Admin'

		api.v1.project.all().then(data => {
			var tbody = document.querySelector('#projects-list > tbody')
			for (var i = 0; i < data.projects.length; i++) {
				tbody.appendChild(create_project_row(data.projects[i], is_admin))
			}
		})
	}

	function reload() {
		var tbody = document.querySelector('#projects-list > tbody')
		while (tbody.firstChild)
			tbody.removeChild(tbody.firstChild)

		load_projects(self)
	}


	api.v1.account.self().catch(xhr => ({
		err: xhr.responseText
	})).then(self => {
		var box = document.getElementById('msg-box')

		var trustLevels = {
			'Admin': 'You have admin privileges and can create & delete projects.',
			'Verified': 'You are verified and can create projects.',
		}

		var trust = trustLevels[self.trust]
		if (self.err)
			trust = self.err

		box.appendChild(el('p', [trust]))

		var is_admin = self.trust === 'Admin'
		var is_verified = self.trust === 'Verified' || is_admin

		var table = document.getElementById('projects-list')

		if (is_verified) {
			var create_btn = el('button#create', ['create project'])
			create_btn.addEventListener('click', create_new_project, false)
			table.parentNode.insertBefore(create_btn, table)
		}

		user_data = self
		load_projects()
	})

})