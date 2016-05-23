(function(scope) {
	scope.CATEGORY_FACET = 0
	scope.CATEGORY_RESEARCH = 1
	scope.CATEGORY_CHALLENGE = 2
})(window);

/* visualisation conf: window.explore_conf */
(function (scope) {

	var conf = {}

	/* x axis: either 0.1 or 0.9 */
	var baseX = d3.scale.ordinal()
		.domain(["challenge", "research"])
		.range([0.10, 0.90])

	/* y axis: linear from 0.05 to 0.95 */
	var baseY = d3.scale.linear()
		.range([0.05, 0.95])

	conf.x = (c, p) => baseX(c)
	conf.y = (c, p) => baseY(p)

	/* node radius: power scale */
	conf.size = d3.scale.pow()
		.domain([1, 12])
		.range([4, 8])

	/* node color: either yellowish or gray */
	conf.color = d3.scale.ordinal()
		.domain(["challenge", "research"])
		.range(["#BAF", "#FAB"])

	/* map facet name to node id: <facet><number> */
	var name2id = {}
	var nameMap = {}
	SERP.forEach((f, c) => {
		if (!nameMap[f]) {
			nameMap[f] = {
				name: f.toLowerCase(),
				counter: 0
			}
		}
		name2id[c] = nameMap[f].name + nameMap[f].counter
		nameMap[f].counter += 1
	})
	conf.id_lookup = (name) => name2id[name]

	/* export */
	scope.explore_conf = conf

})(window); // safety
