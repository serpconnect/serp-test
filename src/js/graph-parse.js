(function(scope) {

	var unusedTypes = ["intervention"]
	function remove_unused(edge) {
		var type = edge.type.toLowerCase()
		return unusedTypes.indexOf(type) === -1
	}

	function unique_edges() {
		var edges = {}
		return function(edge) {
			var id = `${edge.source}--${edge.type}--${edge.target}`
			if (edges[id])
				return false
			edges[id] = true
			return true
		}
	}

	/* Connect an entry node with a facet node */
	function process_edge(edge, conf) {
		return {
			id: `${edge.source}--${edge.type}--${edge.target}`,
			source: edge.source + "",
			target: conf.id_lookup(edge.type.toLowerCase()),
			type: 'curve'
		}
	}

	/* construct a node
	 *	node: the graph node
	 *	current: current index, out of max
	 *	max: maximum index
	 *	links: number of edges
	 *	conf: explore_conf that provides d3-scales
	 */
	function process_entry(node, current, max, links, conf) {
		return {
			id: String(node.id),
			revid: (node.type === "challenge" ? 'c' : 'r') + current,
			label: String(node.id),
			x: conf.x(node.type, current / Math.max(max - 1, 1)),
			y: conf.y(node.type, current / Math.max(max - 1, 1)),
			size: conf.size(links),
			color: conf.color(node.type),
			category: node.type === "challenge" ?
				CATEGORY_CHALLENGE : CATEGORY_RESEARCH
		}
	}

	function graph(data, conf) {
		var edges = data.edges()
			.filter(remove_unused)
			.filter(unique_edges())
			.map(e => process_edge(e, conf))

		var rc = 0, cc = 0,
			maxr = data.research().length,
			maxc = data.challenges().length

		var nodes = data.nodes().map((node) => {
			var c = node.type === "challenge" ? (cc++) : (rc++)
			var m = node.type === "challenge" ? (maxc) : (maxr)
			var links = edges.filter((edge) => {
				return edge.source == node.id || edge.target === node.id
			})
			return process_entry(node, c, m, links.length, conf)
		})

		var colors = window.util.colorScheme()
		var usage = window.util.computeUsage(data)

		var add_facet_node = function(name, y) {
			nodes.push({
				id: conf.id_lookup(name),
				x: 0.5,
				y: y,
				size: 8,
				label: name,
				color: colors(name)((usage[name]+0.0) / data.nodes().length),
				category: 0
			})
		}

		var taxonomy = new SERP()
		var totalCategories = Object.keys(taxonomy).length
		taxonomy.forTop(facet => {
			var len = 0

			if (taxonomy[facet])
				len = Object.keys(taxonomy[facet]).length

			taxonomy[facet] = {
				nodes: len,
				counter: 0,
				offset: 0,
				segmentSize: 0,
				weight: len / totalCategories
			}
		})

		var totalWeight = Object.keys(taxonomy)
			.map(facet => taxonomy[facet].weight)
			.reduce((a, b) => a + b)


		var yHeight = 0.9
		var currentY = 0.0
		taxonomy.forTop(facet => {
			var cat = taxonomy[facet]
			cat.segmentSize = yHeight * (cat.weight / totalWeight)
			cat.nodeSize = (cat.segmentSize * 0.75) / (cat.nodes)
			cat.offset = currentY
			currentY += cat.segmentSize
		})

		SERP.forEach((f, c) => {
			if (!c) return

			var facet = taxonomy[f]
			add_facet_node(c, 0.05 + facet.offset + facet.segmentSize * 0.125 + (facet.nodeSize * facet.counter))
			facet.counter += 1
		})

		return {
			nodes: nodes,
			edges: edges
		}
	}

	scope.graph = graph
})(window);
