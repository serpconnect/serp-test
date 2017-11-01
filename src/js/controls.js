/* Control the explore visualisation with filters.
 *
 * var ctrl = new window.control(<sigma instance>)
 *
 * events:
 *	ctrl.bind("*" | "reset" | "select" | "deselect", fn())
 *
 * select node (add node to filter):
 *	ctrl.select(<sigma graph node>)
 *
 * deselect node (remove node from filter):
 *	ctrl.deselect(<sigma graph node>)
 *
 * reset (remove all filters ):
 *	ctrl.reset()
 */
(function (scope) {

	// Add a method to the graph model that returns an
	// object with every neighbors of a node inside:
	sigma.classes.graph.addMethod('neighbors', function(nodeId) {
		var neighbors = {}
		var index = this.allNeighborsIndex[nodeId] || {}

		for (var k in index)
			neighbors[k] = this.nodesIndex[k]

		return neighbors
	})

	function controls(instance) {
		this.filter = new sigma.plugins.filter(instance)
		this.sigma = instance
		this._listeners = []
		this._node = undefined
		this._active = []
		this._timeout = Date.now()
		this.taxonomy = undefined

		instance.bind("clickNode", evt => {
			if (Date.now() - this._timeout <= 50) return
			if (evt.data.node.selected)
				this.deselect(evt.data.node)
			else
				this.select(evt.data.node)
		})

		instance.bind("rightClickNode", evt => {
			if (evt.data.node.category !== CATEGORY_FACET)
				return
			this._fire('collapse', evt.data.node.label)
		})

		instance.bind("doubleClickNode", evt => {
			if (evt.data.node.category !== CATEGORY_FACET)
				return

			var node = evt.data.node
			if (node.selected)
				this.deselect(node)
			this._fire('expand', node.label)
		})
	}

	controls.prototype.useTaxonomy = function(taxonomy) {
		this.taxonomy = taxonomy.tree().clone(/*deep=*/true)
	}

	controls.prototype.reset = function(resetSelected) {
		this._timeout = Date.now()
		this.sigma.graph.nodes().forEach((n) => {
			n.selected = false
			if (n._color)
				n.color = n._color
		})

		this.filter.undo().apply()
		if (resetSelected)
			this._active = []

		this._fire('reset')
	}

	/* sneaky api, _ = might change so don't depend on it */
	controls.prototype._fire = function(evt, data) {
		var ln = this._listeners.length
		while (ln--) {
			var k = this._listeners[ln]
			if (k.on === '*' || k.on === evt)
				k.do.call({}, data)
		}
	}

	controls.prototype.deselect = function (node) {
		if (this._node &&
			this._node.category !== CATEGORY_FACET &&
			this._node.id === node.id)
			this._node = undefined

		node.previouslySelected = node.selected
		node.selected = false

		if (node.category === CATEGORY_FACET)
			this.filter.undo(`facet-${node.id}-filter`)
		else
			this.filter.undo(`node-${node.id}-filter`)
		this._active.splice(this._active.indexOf(node.id), 1)

		/* Colors for nodes that were gray must be restored, but instead of
		 * checking if some other filter exists that forces the node to retain
		 * its gray color, simply reset all colors and let filters gray them
		 * out as necessary.
		 */
		this.sigma.graph.nodes().forEach(n => n.color = n._color || n.color)
		this.filter.apply()

		/* filter.apply() repaints the graph; so toggle back */
		node.previouslySelected = node.selected

		this._fire('deselect')
	}

	controls.prototype.reapply = function () {
		var nodes = this.sigma.graph.nodes()
		var history = this._active
		this._active = []
		for (var i = 0; i < history.length; i++) {
			var id = history[i]
			for (var j = 0; j < nodes.length; j++) {
				if (nodes[j].id === id) {
					this.select(nodes[j])
					break
				}
			}
		}
	}

	controls.prototype.select = function (node) {
		if (this._node && node.category !== CATEGORY_FACET)
			this.deselect(this._node)

		if (node.category !== CATEGORY_FACET)
			this._node = node

		this._active.push(node.id)
		node.previouslySelected = node.selected
		node.selected = true

		/* however we filter, always keep facets visible */
		if (node.category === CATEGORY_FACET) {
			/* clicked on facet: filter out all nodes that aren't connected */
			var adjacent = this.sigma.graph.neighbors(node.id)
			this.filter.nodesBy(n => {
				return adjacent[n.id] || n.category === CATEGORY_FACET
			}, `facet-${node.id}-filter`)
		} else {
			/* Clicked on node: do matching based on complete and incomplete
			 * matches, see: https://trello.com/c/HcpPVQoK
			 */

			/* Match effect and scope facets from node to all other nodes
			 * in order to determine matching: COMPLETE, INCOMPLETE or NONE.
			 */
			var facets = Object.keys(this.sigma.graph.neighbors(node.id))
			var EFFECT = this.taxonomy.dfs('EFFECT')
			var SCOPE  = this.taxonomy.dfs('SCOPE')

			this.filter.nodesBy((n) => {
				/* early bail for facets b/c we always want to show them */
				if (n.category === CATEGORY_FACET) return true

				/* we also want to show the node itself */
				if (node === n) return true

				/* since n is an entry, neighbors are facets */
				var has = Object.keys(this.sigma.graph.neighbors(n.id))
				var matching = has.length ? 2 : 0

				for (var i = 0; i < has.length; i++) {
					var in_ref = facets.indexOf(has[i]) >= 0

					var effect = has[i] === "EFFECT" || EFFECT.dfs(has[i])
					if (effect && !in_ref) {
						matching = 1
						break
					}

					var scope = has[i] === "SCOPE" || SCOPE.dfs(has[i])
					if (scope && !in_ref) {
						matching = 1
						break
					}
				}

				/* complete matching */
				if (matching === 2)
					return true

				/* incomplete matching */
				if (matching === 1) {
					// TODO Make
					if (!n._color)
						n._color = n.color
					n.color = '#AAA'
					return true
				}

				return false
			}, `node-${node.id}-filter`)
		}

		this.filter.apply()
		this._fire('select')
		this.sigma.refresh()
	}

	controls.prototype.bind = function(evt, handler) {
		this._listeners.push({
			on: evt,
			do: handler
		})
	}

	scope.controls = controls
})(window);