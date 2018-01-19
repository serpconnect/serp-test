$(function () {
	/* returned data from project.taxonomy(p): taxonomy and version */
	var baseTaxonomyData

	var querystring = {}
    /* Naive querystring ?a=1&b=c --> {a:1, b:'c'} mapping */
    if (window.location.search) {
        var params = window.location.search.substring(1).split('&')
        for (var i = 0; i < params.length; i++) {
            var split = params[i].indexOf('=')
            var name = params[i].substring(0, split)
            var value = params[i].substring(split + 1)

            querystring[name] = value
        }
    }

	/* used to store order in which elements are added so user can reverse operations */
	var operations = []

	/* svg settings */
	var width = 450
	var height = 450
	var globalDepth = 1
	var currentDepth =1
	/* remove -10 to make svg fill the square from edge-to-edge */
	var radius = (Math.min(width, height) / 2) - 10

	/* colorScheme is defined in util/color.js */
	var color = window.util.colorScheme()

	//used to set text size depending on 'zoom' level
	var tier =0;
	
	/* x-axis should map to a full circle, otherwise strange chart */
	var x = d3.scale.linear().range([0, 2 * Math.PI])

	var exp = 1.3
	/* use pow scale to make root node radius smaller */
	var y = d3.scale.pow().exponent(exp).range([0, radius]);

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

	function computeTextRotation(d) {
		return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
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
	
	var count=0
	function renderGraph(nodeId, dataset, taxonomy,serp) {
		document.getElementById('submitBtn').addEventListener('click', submit, false)
		document.getElementById('backBtn').addEventListener('click', cancel, false)
		document.getElementById('resetBtn').addEventListener('click', reset, false)
		document.getElementById('saveBtn').addEventListener('click', save, false)

		var usage = window.util.computeUsage(dataset, taxonomy)
		var color = window.util.colorScheme(taxonomy)
		var serp = serp
		if(count==0){
			//trimTaxonomy(serp)
		}
		count++
		function trimTaxonomy(d){
			var tree = d.tree
			if(typeof tree !== 'undefined' && tree.length >0){
				tree.forEach(function(child){
					var list = child.tree
					while(list !== 'undefined' && list.length >0){
						list.pop()
					}
				})
			}
		}

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
				.attr("id","svgMain")
				.attr("width", width)
				.attr("height", height)
				.attr('overflow','visible')
			.append("g")
				.attr("id","g")
				.attr("transform", `translate(${width/2}, ${height/2})`)

       function getParent(label){
			if(label == 'serp'){
				return 'serp'
			}
			else{
				var parent = serp.dfs(label).parentId().toLowerCase()
				if(parent =='root') parent='serp'
				return parent
			}
		}

        //temporarily disables Mouse Events for a given time length 
        function toggleMouseEvents(d,on){
	     	if(on){
	     		mouseOut(d)
		     	svg.selectAll("path")
						.on("mousemove", null)
						.on("mouseout", null)
						.on("click",null)
			}else{
				svg.selectAll("path")
				.on("mousemove", mouseMove)
				.on("mouseout", mouseOut)
				.on("click",click)
			}
        }

		function labelScale(d){
			return 14
		}


		function putIntoTaxonomy(serp,node,d){
			serp.tree.forEach( child => {
				if(child.long.toLowerCase()==d.name.toLowerCase()){
					putIntoTaxonomy2(child,node)
				}
			})
		}

		function putIntoTaxonomy2(d,node){
			if(d.short.toLowerCase()==node.parent.toLowerCase()){
				d.tree.push(node)
				return
			}
			if(typeof d.tree !== 'undefined' && d.tree.length >0){
				d.tree.forEach(function(child){
					putIntoTaxonomy(child,node)
				})
			}
		}

		function newFacet(cNode,d,newD){
			var arcN = arc(newD)
			svg.append("path")
			.attr("d", arcN)
			.attr("id", 'path'+cNode.long)
			.style("fill", color(d.name)(relativeUse(d)))
			.style("stroke", '#f2f2f2')
			.on("click", click)
		}

		function addSubfacet(evt) {
            var facetId = this.parentNode.parentNode.dataset.facet
            var facetNode = subtree.dfs(facetId)

            modals.addTextBox(function (newid, newname) {
                newid = newid.toUpperCase()
                var idExists = subtree.id() === newid || !!subtree.dfs(newid)
                if (idExists) {
                    var existing = this.querySelector('div.complaint')
                    if (existing)
                        existing.parentNode.removeChild(existing)

                    document.getElementById("confirm").parentNode.appendChild(
                        el("div.complaint", ["That name already exists"])
                    )
                    return
                }

                entityClassificiation[newid] = []

                // facetNode.addChild(new FacetNode(newid, newname, [],  facetNode.id()))
                document.body.removeChild(this)

                rebuild()
            })
        }

		Node = function(short,long,parent,tree) {
            this.short = short
            this.long = long
            this.parent = parent
            this.tree = tree
            this.usage=0
    	}


	    function mouseMove(d) {
			if (d.depth === 0) return
			svg.select('#text'+d.name)
		 		.attr('font-size', 14)
		 		.attr("transform", function() {return "rotate(0)"  })
		 		.attr('text-anchor', 'middle')
				.attr('x', arcX)
				.attr('y', arcY)
				.attr('dx',"0")
		}

		function mouseOut(d){
			if (d.depth === 0) return
		 	svg.select('#text'+d.name)
				.attr('font-size', 12)
				.attr("x", function(d) { return y(d.y); })
		    	.attr("dx",function(d){return "6"}) 
		    	.attr("y", d.y)
		    	.attr("transform", function() {return "rotate(" + computeTextRotation(d) + ")"})
		    	.attr('text-anchor','none')
				.style("text-shadow", "none")
		}

    	function complain(where, what) {
    	    where.appendChild(el("div#complaint.complaint", [what]));
	    }

	    function removeEvents(){
	    	document.getElementById('submitBtn').removeEventListener('click', submit, false)
			document.getElementById('backBtn').removeEventListener('click', cancel, false)
			document.getElementById('resetBtn').removeEventListener('click', reset, false)
			document.getElementById('saveBtn').removeEventListener('click', save, false)
	    }

	    function removeSvg(){
	    	document.getElementById('g').remove()
			document.getElementById('svgMain').remove()
	    }

	    function save(){
	    	var taxonomyData = {
	    		taxonomy: serp.flatten(),
	    		version: baseTaxonomyData.version + 1
	    	}
	    	taxonomyData.taxonomy.splice(0, 1) // remove 'root' node
	    	baseTaxonomyData = taxonomyData

	    	return api.v1.project.taxonomy(querystring.p, taxonomyData).then(() => {
	    		alert("ok")
	    	}).fail(xhr => alert(xhr.responseText))
	    }

	    function reset() {
	    	//modal confirm
	    	window.modals.confirmPopUp('this will reset your changes, are you sure??', doIt)
		    function doIt(){
		    	//reset everything
		    	removeEvents()
				removeSvg()
				count=0
				operations = []
				globalDepth =1
				currentDepth=1
				y = d3.scale.pow().exponent(1.3).range([0, radius])
				//load initial taxonomy
		    	Dataset.loadDefault(data => {
					api.v1.taxonomy().then(serp => {
						var taxonomy = new window.Taxonomy(serp.taxonomy)
						renderGraph('#taxonomy', data, taxonomy, taxonomy.root)
					})
				})
		    }	

	    }

		function cancel(){
			var current = operations.pop()
			if(current){
				document.getElementById('path'+current).remove()
				document.getElementById('text'+current).remove()
				var x = serp.dfs(current)
				var y = serp.dfs(x.parent.toLowerCase())
				y.tree.pop()
			}
			//get depth level via operations
		}

		function click(d){
			document.getElementById('newFacet').style.background = color(d.name)(relativeUse(d))
			if(d.name.length<20)
				document.getElementById('facetName').innerText = d.name	
			else
				document.getElementById('facetName').innerText = d.name.substring(1,12)+"...";

			currentDepth = d.depth+1
			svg.selectAll("path")
				.style("stroke", '#f2f2f2')
			svg.select("#path"+d.name)
				.style("stroke", '#000')
		}

		function submit(){
			$('.complaint').remove()
			var	currentName = document.getElementById('facetName').innerText
			var newId = document.getElementById('idInput').value
			var newName = document.getElementById('nameInput').value
			let idExists = serp.dfs(newId)
			if(idExists){
				complain(document.getElementById('newFacet'), "Id is already in use")
				return
			}
			else if(!newId){
				complain(document.getElementById('newFacet'), "Please enter an Id for this Facet")
				return
			}
			else if(!newName){
				complain(document.getElementById('newFacet'), "Please enter a Name for this Facet")
				return
			}
			/* removes events from current svg, otherwise these will still be called after current svg is removed */
			removeEvents()
			/* create new node and update taxonomy */
			var cNode = new window.FacetNode(newId,newName,[],currentName)
			var x = serp.dfs(currentName)
			x.addChild(cNode)
			/* deletes current svg */
			removeSvg()
			/* adds to list of operations so user can reverse step */
			operations.push(newId)
			/* update scaling for new svg */
			if(currentDepth > globalDepth){
				globalDepth+=1
				exp = exp-0.15
				y = d3.scale.pow().exponent(exp).range([0, radius]);
			}
			/* creates new svg with updates */
			renderGraph('#taxonomy', dataset, taxonomy, serp)
		}

		/* setup the main graph */
		svg.selectAll("path")
			.data(partition).enter()
			.append("path")
				.attr("d", arc)
				.attr("id", d=> 'path'+d.name)
				.style("fill", d => color(d.name)(relativeUse(d)))
				.style("stroke", '#f2f2f2')
				.on("mousemove", mouseMove)
				.on("mouseout", mouseOut)
				.on("click", click)

		/* add labels positioned at area center */
		svg.selectAll("text")
			.data(partition).enter()
			.append('text')
			.attr("id", d => 'text'+d.name)
			.attr('font-family', 'Arial, sans-serif')
			.attr("transform", function(d) { if(d.name!='serp')return "rotate(" + computeTextRotation(d) + ")"  })
		    .attr("x", function(d) { return y(d.y); })
		    .attr("dx",function(d){ if(d.name!='serp') return "6"}) // margin
		    .attr("dy", ".35em") // vertical-align
		    .text(function(d) { return d.name; })
			.attr('pointer-events', 'none')
			.attr('font-size', 12)
			.append('tspan')
				.on("click", click)
			svg.select("#textserp")
				.attr('text-anchor', 'middle')
				.attr('x', arcX)
				.attr('y', arcY)

			//can't extend from root node
			svg.select('#pathserp').on('click',null);
			svg.select('#textserp').on('click',null);
			//sets initial colour to effect
			var activeName = document.getElementById('facetName').innerText
			document.getElementById('newFacet').style.background = document.getElementById('path'+activeName).style.fill

			svg.select("#path"+document.getElementById('facetName').activeName)
				.style("stroke", '#000')

	}
	Dataset.loadDefault(data => {
	    if (!querystring.p) return

		api.v1.project.taxonomy(querystring.p).then(serp => {
			baseTaxonomyData = serp
			var taxonomy = new window.Taxonomy(serp.taxonomy)
			renderGraph('#taxonomy', data, taxonomy, taxonomy.root)
		})
	})
})
// // only works on live
// Dataset.loadDefault(data => {
// 		Promise.all([
// 			api.v1.taxonomy(),
// 			api.v1.collection.taxonomy(682)
// 		]).then(taxonomies => {
// 			var taxonomy = new window.Taxonomy(taxonomies[0].taxonomy)
// 			taxonomy.extend(taxonomies[1].taxonomy)
// 			//taxonomy.extend(taxonomies[1].taxonomy)
// 			renderGraph('#taxonomy', data, taxonomy)
// 		})
// 	})
// })