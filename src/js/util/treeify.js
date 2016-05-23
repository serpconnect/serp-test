(function (scope) {
	/* Convert the dataset into a tree structure and compute sizes so that the
	 * graph partitions end up equally large. Do this by propagating the current
	 * size and divide it up amongst the children, recursively.
	 */
	function treeify(rootNode, len) {
		return {
			name: 'serp',
			size: 1.0,
			usage: len,
			children: recurseTree(rootNode, 1.0)
		}
	}
	function recurseTree(parentNode, parentSize) {
		if (!parentNode) return []

		var keyset = Object.keys(parentNode).filter(n => n !== 'usage')
		var kids = []

		/* Divide up the parent size equally amongst the children */
		var size = parentSize / keyset.length

		for (var i = 0; i < keyset.length; i++) {
			var facet = parentNode[keyset[i]]

			var entry = {
				name: keyset[i],
				size: size,
				usage: facet.usage
			}

			var kidz = recurseTree(facet, size)

			/* A D3 parition layout leaf node doesn't have children key */
			if (kidz.length > 0)
				entry.children = kidz

			kids.push(entry)
		}

		return kids
	}
	scope.treeify = treeify
})((window.util = window.util || {}))