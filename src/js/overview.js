$(function () {
	/* svg settings */
	var width = 320
	var height = 320

	/* remove -10 to make svg fill the square from edge-to-edge */
	var radius = (Math.min(width, height) / 2) - 10
	var nbrPercent = d3.format("%") // e.g 53%
	var nbrSI = d3.format("s") // e.g 5.1k

	var divNode = d3.select("body").node();

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

	//used to set text size depending on 'zoom' level
	var tier =1;

	//sets tier level, 
	var tierScale = (name) => {
		switch (name) {
		case 'serp':
			return (tier-1)
		case 'scope':
		case 'context':
		case 'effect':
		case 'intervention':
			return 2
		default:
			return 3
		}
	}

	//returns scalar for text respective of zoom depth
	var textScale = (tier) => {
			switch (tier) {
		case 1:
			return 1
		case 2:
			return 1.5
		case 3:
			return 2.5
		default:
			return 1
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
	
	function getStartAngle(d) {
		return Math.max(0, Math.min(2 * Math.PI, x(d.x)))
	}
	function getEndAngle(d) {
		return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)))
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
		
		var defs = svg.append("defs");
		var filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("height","130%");

		filter.append("feGaussianBlur")
	        .attr("in","SourceAlpha")
	        .attr("stdDeviation", 3)
	        .attr("result", "blur");

		filter.append("feOffset")
		    .attr("in", "blur")
		    .attr("dx", 4)
		    .attr("dy", 4)
		    .attr("result", "offsetBlur");
		    var feMerge = filter.append("feMerge");
		 //todo: set dx,dy values respective to angle of arc 

		feMerge.append("feMergeNode")
		    .attr("in", "offsetBlur")
		feMerge.append("feMergeNode")
		    .attr("in", "SourceGraphic");

	    function mouseMove(d) {
			let text  = svg.selectAll("text").filter(text => text.name==d.name).pop()
		 	let facet = svg.selectAll("path").filter(path => path.name==d.name).pop()
		 	let textSize = (labelScale(d.name) * (textScale(tier)))
		 	d3.select(text[0])
		 		.attr('font-size', textSize + ((textSize)/10)  )
		 		.style("text-shadow", "1px 1px 3px #fff")
		 	d3.select(facet[0])
	        	.style("filter", "url(#drop-shadow)");
	        d3.select(facet[0])	
				.transition()
				.duration(500)
				.ease('elastic')
				.attr('transform',function(d){
					var dist = 1;
					var startAngle = getStartAngle(d)
					var endAngle = getEndAngle(d)
					var midAngle = ((endAngle - startAngle)/2) + startAngle;
					var x = Math.sin(midAngle) * dist;
					var y = Math.cos(midAngle) * dist;
					return 'translate(' + x + ',' + y + ')';
				});
		}

		function mouseOut(d){
			let text  = svg.selectAll("text").filter(text => text.name==d.name).pop()
		 	let facet = svg.selectAll("path").filter(path => path.name==d.name).pop()
		 	d3.select(text[0])
				.attr('font-size', d => (labelScale(d.name) * (textScale(tier))) )
		 		.style("text-shadow", "none")
			d3.select(facet[0])
	      		.attr("stroke","none")
	      		.style("filter","none");
			d3.select(facet[0])
				.transition()
				.duration(500)
				.ease('bounce')
				.attr('transform','translate(0,0)');
		}

		function facetInfo(d){
			var info = window.info.taxonomyInfo(d.name)
			var explanation = document.getElementById('facet-explanation')
			var facetTitle = document.getElementById('facet-title')
			explanation.innerText=info[0]
			var title = d.name
			if(d.name!='serp'){
				explanation.style.fontStyle= "normal"
				explanation.style.color = "black";
			}
			else{
				explanation.style.fontStyle= "italic"
				explanation.style.color = '';
			}
			if(info[1] != 0){
				title = title +' ('+info[1]+')'
			}
			facetTitle.innerText = title
			var square = document.getElementById('square')
			square.style.background = color(d.name)(relativeUse(d))
		}

		function click(d){
			facetInfo(d) 
			function first(d) {
				return new Promise(function(resolve, reject) {
				        zoom(d)
				        resolve("Stuff worked!");
				})
			}
			//repositions text
			setPos = function(){
				setTimeout(function(){
					svg.selectAll(".position").transition()
						.attr('text-anchor', 'middle')
						.attr('x', arcX)
						.attr('y', arcY)
					 svg.selectAll("text")
						.attr('font-size', d => (labelScale(d.name) * (textScale(tier)) ))
					}, 1200)
			}
			//resets all text class and sets font size
			function switchOff() {
				setTimeout(function(){
				    svg.selectAll("text")
				    	.classed("position",false)
			    },2000)
			}
			first(d).then(setPos).then(switchOff)
		}

		function zoom(d) {
			tier = tierScale(d.name)
			let activeText = svg.selectAll("text").filter( text => window.info.parent(text.name)===d.name||text.name==d.name).pop()
			let hiddenText = svg.selectAll("text").filter( text => window.info.parent(text.name)!==d.name && text.name!==d.name).pop()
			activeText.forEach(active => {
				active.classList.add("position");
				active.classList.remove("hide");
			})
			hiddenText.forEach(hidden => {
				hidden.classList.add("hide");
			})
		  	svg.transition()
			    .duration(750)
			    .tween("scale", function() {
			    	var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
		            yd = d3.interpolate(y.domain(), [d.y, 1]),
		            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
		        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
		      })
		    .selectAll("path")
		    	.attrTween("d", function(d) { return function() { return arc(d); }; });
			if(d.name =="serp"){
				 svg.selectAll("text")
				 	.classed("position",true)
				 	.classed("hide", false)
			}
		}

		/* setup the main graph */
		svg.selectAll("path")
			.data(partition).enter()
			.append("path")
				.attr("d", arc)
				.style("fill", d => color(d.name)(relativeUse(d)))
				.on("mousemove", mouseMove)
				.on("mouseout", mouseOut)
				.on("click", click)

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
				.text(d => d.name)
				.on("mousemove", mouseMove)
				.on("mouseout", mouseOut)
				.on("click", click)
	}

	Dataset.loadDefault(data => {
		renderGraph('#taxonomy', data)
	})
})