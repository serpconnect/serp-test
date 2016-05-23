(function(scope) {

	function makeEntry(entry) {
		var entryId = String(entry.id)

		var color = 'chl'
		if (entry.type !== 'challenge')
			color = 'res'

		var div = el('div', [
			el(`span.${color}`, [entryId]),
			': ' + (entry.description || entry.reference || "information n/a")
		])

		div.dataset.entryId = entry.id
		div.addEventListener('click', inspectEntry, false)

		return div
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

	function inspectEntry(evt) {
		var id = this.dataset.entryId

		window.api.ajax("GET", window.api.host + "/v1/entry/" + id).done(entry => {
			window.api.ajax("GET", window.api.host + "/v1/entry/" + id + "/taxonomy").done(taxonomy => {
				var close = el('div.close-btn')

				close.addEventListener('click', function (evt) {
					document.body.removeChild(close.parentNode.parentNode)
				}, false)

				var constructFacet = function(name) {
					var samples = Object.keys(taxonomy).filter(facet => reverseMap[facet.toLowerCase()] === name) || []
					if (!samples.length) return undefined

					return el("div.modal-header-title", [
						name,
						samples.map(facet => {
							var filtered = taxonomy[facet] || []
							return el('div.modal-sub-sub-item', [
								shorthandMap[facet.toLowerCase()],
								filtered.map(sample => (sample === "unspecified"
									? undefined : el('div.modal-sub-sub-item', [sample])))
							])
						})
					])
				}

				var extraInfo = []
				if (entry.type === "challenge") {
					extraInfo.push(
						el('div.modal-header-title', ['Description']),
						el('div.modal-sub-item', [entry.description]))
				} else {
					extraInfo.push(
						el('div.modal-header-title', ['References']),
						el('div.modal-sub-item', [entry.reference]),
						el('div.modal-header-title', ['DOI']),
						el('div.modal-sub-item', [entry.doi]))
				}

				var modal = el('div.modal', [el('div', [
					close, el("div.modal-entry-type", [entry.type]),
					el("div.modal-header-title", [`entry #${entry.id}`]),
					el("div.modal-divider"),
					constructFacet("Effect"),
					constructFacet("Scope"),
					constructFacet("Context"),
					el("div.modal-divider"),
					extraInfo
				])])

				document.body.appendChild(modal)
			})
		})
	}

	function Listing(div, instance, dataset) {
		this.div = div
		this.chl = dataset.challenges()
		this.res = dataset.research()

		this._instance = instance

		this.update()
	}

	Listing.prototype.changeDataset = function (ds) {
		this.chl = ds.challenges()
		this.res = ds.research()
	}

	Listing.prototype.registerEvents = function(ctrl) {
		var _update = () => this.update()
		ctrl.bind('select', _update)
		ctrl.bind('deselect', _update)
		ctrl.bind('reset', _update)
	}

	Listing.prototype.update = function() {
		// clear list b/c it's easier than merging two lists...
		while (this.div.firstChild)
			this.div.removeChild(this.div.firstChild)

		var visible = this._instance.graph.nodes()
			.filter(n => !n.hidden)
			.filter(n => n.category !== CATEGORY_FACET)

		while (visible.length) {
			var node = visible.shift()

			// id = '?XYZ' where XYZ is index in chl/res array
			var idx = node.revid.substr(1)
			var entry

			if (node.category === CATEGORY_CHALLENGE)
				entry = makeEntry(this.chl[idx])
			else
				entry = makeEntry(this.res[idx])

			this.div.appendChild(entry)
		}
	}

	scope.listing = Listing
})(window)