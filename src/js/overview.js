$(function () {
	/* svg settings */
	var width = 320
	var height = 320

	/* remove -10 to make svg fill the square from edge-to-edge */
	var radius = (Math.min(width, height) / 2) - 10
	var nbrPercent = d3.format("%") // e.g 53%
	var nbrSI = d3.format("s") // e.g 5.1k

	/* colorScheme is defined in util/color.js */
	var color = window.util.colorScheme()

	/* adjust font size on a per-label granularity */
	var labelScale = (label) => {
		switch (label) {
		/* root node */
		case 'serp':
			return 15
		case 'intervention':
		case 'people':
		case 'planning':
			return 10
		case 'scope':
		case 'context':
		case 'effect':
		case 'sut':
			return 11
		default:
			return 9
		}
	}

	/* x-axis should map to a full circle, otherwise strange chart */
	var x = d3.scale.linear().range([0, 2 * Math.PI])

	/* use pow scale to make root node radius smaller */
	var y = d3.scale.pow().exponent(1.2).range([0, radius]);

	/* compute relative to total number of entries, found in root */
	function relativeUse(d) {
		/* root node has no parent, but its usage is known (100%) */
		if (!d.parent)
			return 1.0

		var root = d.parent
		while (root.parent)
			root = root.parent
		return d.usage / Math.max(root.usage, 1)
	}

	/* sample x coord of arc for label positioning */
	function arcX(d) {
		var angle = Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx * 0.5)))
		var radius = Math.max(0, y(d.y + d.dy * 0.5))
		return Math.cos(angle - 0.5 * Math.PI) * radius
	}

	/* sample y coord of arc for label positioning */
	function arcY(d) {
		if (d.name === 'serp')
			return 0

		var angle = Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx * 0.5)))
		var radius = Math.max(0, y(d.y + d.dy * 0.5))
		return Math.sin(angle - 0.5 * Math.PI) * radius
	}

	/* return the text of the second tspan (second line) for each facet */
	function textLabel(d) {
		/* for the root node, simply show number of entries */
		if (d.name === 'serp')
			return nbrSI(d.usage)

		return `${nbrSI(d.usage)} (${nbrPercent(relativeUse(d))})`
	}

	/* Idea is to map the flat tree into an arc tree using the computed
	 * extents (d.dx, d.dy). A partition layout normally looks something
	 * like this: http://codepen.io/anon/pen/Bfpmg
	 * The y-axis is used to determine inner and outer radii, while
	 * the x-axis determines start and end angles for the arc.
	 */
	var arc = d3.svg.arc()
		.startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x))))
		.endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))))
		.innerRadius(d => Math.max(0, y(d.y)))
		.outerRadius(d => Math.max(0, y(d.y + d.dy)))

	function renderGraph(nodeId, dataset) {
		var usage = window.util.computeUsage(dataset)
		var serp = new SERP()

		/* Ensure that all facets and sub facets have an object that contains the
		 * 'usage' key, which is parsed during treeify and added to the new node.
		 */
		SERP.forEach((f, k) => {
			var obj = serp.get(f, k)
			if (obj)
				obj.usage = usage[k]
			else
				serp.set(f, k, { usage: usage[k] })

			serp.get(f, null).usage = usage[f]
		})

		var partition = d3.layout.partition()
			.value(d => d.size)
			.nodes(window.util.treeify(serp, dataset.nodes().length))

		var svg = d3.select(nodeId)
			.append("svg")
				.attr("width", width)
				.attr("height", height)
			.append("g")
				.attr("transform", `translate(${width/2}, ${height/2})`)

		/* setup the main graph */
		svg.selectAll("path")
			.data(partition).enter()
			.append("path")
				.attr("d", arc)
				.style("fill", d => color(d.name)(relativeUse(d)))

		/* add labels positioned at area center */
		svg.selectAll("text")
			.data(partition).enter()
			.append('text')
			.attr('font-family', 'Arial, sans-serif')
			/* scale font-size to ensure that long names fit inside arc area */
			.attr('font-size', d => labelScale(d.name))
			/* align text around the calculated point */
			.attr('text-anchor', 'middle')
			/* alternative to x/y is to use textPath, but hard to make centered */
			.attr('x', arcX)
			.attr('y', arcY)
			/* svg doesn't support linebreaks, so we'll have to live with spans */
			.append('tspan')
				.text(d => d.name === 'serp' ? nodeId.substr(1) : d.name)
			.append('tspan')
				.text(textLabel)
				.attr('x', arcX)
				.attr('dy', '1.2em')
	}

	Dataset.loadDefault(data => {
		renderGraph('#challenges', data.filter("challenge"))
		renderGraph('#research', data.filter("research"))
	})
})