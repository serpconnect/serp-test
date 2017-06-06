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
		var targetId = conf.id_lookup(edge.type.toLowerCase())
		if (!targetId)
			console.log(edge.type.toLowerCase(), remove_unused(edge))
		return {
			id: `${edge.source}--${edge.type}--${edge.target}`,
			source: edge.source + "",
			target: conf.id_lookup(edge.type.toLowerCase()),
			type: 'curve'
		}
	}

	function rewrite(taxonomy, extended) {
		return function(edge) {
			var node = taxonomy.root.dfs(edge.type)
			
			if (node)
				return edge

			if (!extended)
				return undefined

			function dfs(parent, node, search) {
				if (node.id().toLowerCase() === search.toLowerCase())
					return parent
				
				for (var i = 0; i < node.tree.length; i++) {
					var found = dfs(node, node.tree[i], search)
					if (found)
						return found
				}

				return undefined
			}

			var facet = edge.type
			do {
				var parent = undefined
				for (var i = 0; i < extended.root.tree.length; i++) {
					var found = dfs(extended.root, extended.root.tree[i], facet)
					if (found) {
						parent = found
						break;
					}
				}
				
				if (!parent)
					return undefined

				facet = parent.id()
			} while (!taxonomy.root.dfs(facet))

			return {
				source: edge.source,
				target: edge.target,
				type: facet
			}
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

	function graph(taxonomy, extendedTaxonomy, data, conf) {
		var edges = data.edges()
			.filter(unique_edges())
			.map(rewrite(taxonomy, extendedTaxonomy))
			.filter(e => e && e.target && e.source && e.type)
			.filter(remove_unused)
			.map(e => process_edge(e, conf))
			
		/* map facet name to node id: <facet><number> */
		var name2id = {}
		var nameMap = {}
		taxonomy.tree().map(function (node, i) {
			nameMap[node.short] = { name: node.short.toLowerCase(), counter: 0 }
		})
		function count(parent, node) {
			if (!node.isTreeLeaf())
				node.mapP(count)
			else {
				name2id[node.short.toLowerCase()] = nameMap[parent.short].name + 
																nameMap[parent.short].counter
				nameMap[parent.short].counter += 1
			}
		}
		taxonomy.tree().map(child => child.mapP(count))

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
				id: name2id[name],
				x: 0.5,
				y: y,
				size: 8,
				label: name,
				color: colors(name)((usage[name]+0.0) / data.nodes().length),
				category: 0
			})
		}

		var facets = {}
		var totalCategories = taxonomy.root.tree.length
		taxonomy.tree().mapP(function initWeight(parent, node, i) {
			var len = node.tree.length
			facets[node.short.toLowerCase()] = {
				nodes: len,
				counter: 0,
				offset: 0,
				segmentSize: 0,
				weight: len / totalCategories
			}
		})

		var totalWeight = Object.keys(facets)
			.map(facet => facets[facet].weight)
			.reduce((a, b) => a + b, 0)

		var yHeight = 0.9
		var currentY = 0.0
		taxonomy.tree().map(function place(node, i) {
			var cat = facets[node.short.toLowerCase()]
			cat.segmentSize = yHeight * (cat.weight / totalWeight)
			cat.nodeSize = (cat.segmentSize * 0.75) / (cat.nodes)
			cat.offset = currentY
			currentY += cat.segmentSize
		})

		taxonomy.tree().mapP(function add(parent, node, i) {
			if (!node.isTreeLeaf() || parent.isRoot())
				return node.mapP(add)

			var facet = facets[parent.short.toLowerCase()]
			add_facet_node(node.short.toLowerCase(), 0.05 + facet.offset + 
									facet.segmentSize * 0.125 + 
									facet.nodeSize * facet.counter)
			facet.counter += 1
		})

		return {
			nodes: nodes,
			edges: edges
		}
	}

	scope.graph = graph
})(window);
