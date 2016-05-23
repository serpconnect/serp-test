(function (scope) {
	/* Returns a flattened SERP object where each key points to its usage */
	function computeUsage(dataset) {
		var facets = {}
		var unique_facets = {}

		/* Accumulate edges for each facet, but only count edges/facet once per
		 * node, i.e count multiple context edges for the same node as 1 edge.
		 */
		dataset.edges().forEach(edge => {
			var type = edge.type.toLowerCase()
			var node = edge.source

			if (!unique_facets[type])
				unique_facets[type] = []

			if (unique_facets[type].indexOf(node) !== -1)
				return

			unique_facets[type].push(node)

			if (!facets[type])
				facets[type] = 1
			else
				facets[type] += 1
		})


		// Make sure we have entries for all keys
		SERP.forEach((f, k) => {
			if (k)
				if (!facets[k])
					facets[k] = 0

			if (!facets[f])
				facets[f] = 0

			if (!k)
				return

			facets[f] = Math.max(facets[f], facets[k])
		})

		return facets
	}
	scope.computeUsage = computeUsage
})((window.util = window.util || {}))