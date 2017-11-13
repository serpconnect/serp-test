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
	var tier =0;
	//used for back btn referencing 
	var currentTier = tier;
	//used to set angle of depth when 'hover over'
	var relativeAngleX = 4;
	var relativeAngleY = 4;

	var tierScale = function (taxonomy, facet) {
	    var nodes = [taxonomy.tree()]
	    var swap = [] /* add to this, then swap when done */
	    var dTier = 1
	    facet = facet.toLowerCase()
	    while (nodes.length > 0) {
	        var node = nodes.shift()
        	if(node.short.toLowerCase() === facet){
            	return dTier
       		 }
	        for(var i = 0; i < node.tree.length; i++){
	            swap.push(node.tree[i])
	        }
	        if (nodes.length === 0) {
	            nodes = swap
	            swap = []
	            dTier += 1
	        }
	    }
	    //skips first so that if facet = "serp" it returns tier-1
	    return tier-1
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

	function updateFilter(d){
		if(d.x >= 0 && d.x < 0.25){
			return relativeAngleX = -4, relativeAngleY = 4
		}
		else if(d.x >= 0.25 && d.x < 0.5){
			return relativeAngleX = -4, relativeAngleY = -4
		}
		else if(d.x >= 0.5 && d.x < 0.75){
			return relativeAngleX = 4, relativeAngleY = -4
		}
		else{
			return relativeAngleX = 4, relativeAngleY = 4
		}
	}

	//allows angles etc to be updated.
	function setFilter(filter){
		filter.append("feGaussianBlur")
	        .attr("in","SourceAlpha")
	        .attr("stdDeviation", 3)
	        .attr("result", "blur");

		filter.append("feOffset")
		    .attr("in", "blur")
		    .attr("dx", relativeAngleX)
		    .attr("dy", relativeAngleY)
		    .attr("result", "offsetBlur");
		    var feMerge = filter.append("feMerge");

		feMerge.append("feMergeNode")
		    .attr("in", "offsetBlur")
		feMerge.append("feMergeNode")
		    .attr("in", "SourceGraphic");
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

	function renderGraph(nodeId, dataset, taxonomy) {
		var usage = window.util.computeUsage(dataset, taxonomy)
		var color = window.util.colorScheme(taxonomy)
		var serp = taxonomy.tree()

		/* Ensure that all facets and sub facets have an object that contains the
		 * 'usage' key, which is parsed during treeify and added to the new node.
		 */
		serp.map(function init(node) {
			node.usage = usage[node.id().toLowerCase()]
			node.map(init)
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

        setFilter(filter)

       function getParent(label){
			if(label == 'serp'){
				return 'root'
			}
			else{
				return serp.dfs(label).parentId().toLowerCase()
			}
		}

        //temporarily disables Mouse Events for a given time length 
        function toggleMouseEvents(delay,d){
        	mouseOut(d)
	     	svg.selectAll("path")
					.on("mousemove", null)
					.on("mouseout", null)
					.on("click",null)
			svg.selectAll("tspan")
				.on("mousemove", null)
				.on("mouseout", null)
				.on("click",null)
			setTimeout( function(){
				svg.selectAll("path")
					.on("mousemove", mouseMove)
					.on("mouseout", mouseOut)
					.on("click",click)
				svg.selectAll("tspan")
					.on("mousemove", mouseMove)
					.on("mouseout", mouseOut)
					.on("click",click)
			}, delay)
        }

	    function mouseMove(d) {
	    	updateFilter(d)
	    	setFilter(filter)
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

		function isBackButton(name){
		if(currentTier==3 && getParent(name)=="root"){
			return true
		}
		else if(name =="serp"){
			return true
		}
			return false
		}

		//when user clicks 'serp'/'back' on sundial
		function backBtn(){
			if(currentTier==3){
				svg.selectAll("text")
					.classed("position",true).transition()
					.duration(300)
					.attr('font-size', d => (labelScale(d.name) * (textScale(tier)) ))
				svg.selectAll('.position')
					.attr('opacity',0)
				svg.selectAll('.position').transition()
	   				.delay(300)
	    			.attr('opacity', 1);
			}
			else if(currentTier ==2){
				svg.selectAll('tspan')
					.attr('opacity',0)
				svg.selectAll("text")
					.classed("position",true)
				 	.classed("hide", false)
				svg.selectAll('tspan').transition()
	   				.delay(300)
	    			.attr('opacity', 1)
	    		svg.selectAll("path")
    				.classed("disappear",false)
			}
			else{
				svg.selectAll("text")
					.classed("position",true)
				 	.classed("hide", false)
				 svg.selectAll("path")
    				.classed("disappear",false)
			}
		}

		//takes care of the transitions of text and facets
		function pathWindUp(d){
			svg.selectAll("text").transition()
				.duration(750)
				.attr('font-size', d => (labelScale(d.name) * (textScale(tier)) ))
		  	svg.transition()
			    .duration(750)
			    .tween("scale", function() {
			    	var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx] ),
		           		yd = d3.interpolate(y.domain(), [d.y, 1]),
		            	yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
		        	return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
		      	})
		    .selectAll("path")
		    	.attrTween("d", function(d) {
		    		return function() { 
		    			svg.selectAll(".position")
							.attr('text-anchor', 'middle')
							.attr('x', arcX)
							.attr('y', arcY)
		    			return arc(d);
		    		}
		    	})
		}

		function click(d){
			facetInfo(d)
			function first(d) {
				return new Promise(function (R, F) {
	       			zoom(d)
	     			setTimeout(R, 750)
   				})
   			}
			function switchOff() {
				svg.selectAll("text")
				    .classed("position",false)
			}
			first(d).then(switchOff)
		}

		function zoom(d) {
			toggleMouseEvents(750, d)
			currentTier = tier
			tier = tierScale(taxonomy, d.name)
			let activeText = svg.selectAll("text").filter( text => getParent(text.name)===d.name||text.name==d.name).pop()
			let hiddenText = svg.selectAll("text").filter( text => getParent(text.name)!==d.name && text.name!==d.name).pop()
			activeText.forEach(active => {
				active.classList.add("position")
				active.classList.remove("hide")
			})
			hiddenText.forEach(hidden => {
				hidden.classList.add("hide");
			})
			let activeFacet = svg.selectAll("path").filter( path => getParent(path.name)===d.name||path.name==d.name).pop()
			let hiddenFacet = svg.selectAll("path").filter( path => getParent(path.name)!==d.name && path.name!==d.name).pop()
			activeFacet.forEach(active => {
				active.classList.remove("disappear");
			})
			hiddenFacet.forEach(hidden => {
				//keeps centre btn on show
				if(isBackButton(hidden.id)){
					return
				}
				hidden.classList.add("disappear");
			})
			pathWindUp(d)

		    if(isBackButton(d.name)){
		    	console.log('ere')
		    	backBtn()
		    }
		}

		/* setup the main graph */
		svg.selectAll("path")
			.data(partition).enter()
			.append("path")
				.attr("d", arc)
				.attr("id", d=> d.name)
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
		api.v1.taxonomy().then(serp => {
			var taxonomy = new window.Taxonomy(serp.taxonomy)
			renderGraph('#taxonomy', data, taxonomy)
		})
	})
})