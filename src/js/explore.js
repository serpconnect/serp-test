(function() {
	function $$(id) {
		return document.querySelector(id)
	}

	function toggleDiv(sel) {
		var e = $$(sel)
		return function() {
			if (e.style.display === 'block')
				e.style.display = 'none'
			else
				e.style.display = 'block'

			this.classList.toggle('down')
		}
	}

	var instance = undefined,
		ctrl = undefined,
		list = undefined
	function explore(dataset, into) {
		var graph = window.graph(dataset, window.explore_conf)
		if (instance) {
			list.changeDataset(dataset)
			instance.graph.clear()
			instance.graph.read(graph)
			ctrl.reset()
			instance.refresh()
		} else {
			instance = new sigma({
				renderer: {
					container: into,
					type: 'canvas'
				},
				graph: graph,
				settings: {
					// edge color = facet color
					edgeColor: 'target',
					// no scroll zoom, breaks zoomTo
					zoomingRatio: 1.0,
					// disable double-click-to-zoom
					doubleClickEnabled: false
				}
			})

			ctrl = new window.controls(instance)
			list = new window.listing($$('#listing'), instance, dataset)
			list.registerEvents(ctrl)

			$$('#matches').addEventListener('click', () => {
				var showView = $$('#matches').classList.contains('down')
				instance.graph.nodes().forEach(n => {
					if (n.category !== CATEGORY_FACET)
						n.showLabel = showView
				})
				if (showView)
					into.style.width = '75%'
				else
					into.style.width = '100%'
				instance.renderers[0].resize()
				instance.refresh()
			}, false)
		}
	}

	window.onload = function() {
		$$('#explore').classList.add('current-view')
		$$('#help').addEventListener('click', toggleDiv('#helpbox'), false)
		$$('#matches').addEventListener('click', toggleDiv('#listing'), false)

		window.user.collections().done(collz => {
			var selector = $$('#dataset')
			collz.forEach(coll => {
				var opt = document.createElement('option')
				opt.setAttribute('value', coll.id)
				opt.text = coll.name
				selector.appendChild(opt)
			})
		}).always(xhr => {
			Dataset.loadDefault(set => explore(set, $$('#graph')))
		})

		$$('#dataset').addEventListener('change', function (evt) {
			if (this.value === "main")
				Dataset.loadDefault(set => explore(set, $$('#graph')))
			else
				Dataset.loadCollection(this.value, set => explore(set, $$('#graph')))
		})

		// Some browsers do not support the css calc(), or it doesn't work.
		// Detect failure and do what css should've done, 2em = 32px
		var computedHeight = window.getComputedStyle($$('#graph')).height
		if (computedHeight === '0px') {
			var height = `${window.innerHeight - 87 - 35 - 15 - 32}px`
			$$('#graph').style.height = height
			$$('#listing').style.height = height
		}
	}

})();
