$(document).ready(function() {
	function toggleButtonState() {
        var btns = document.querySelectorAll('.btn')
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('submit-disabled')
            if (btns[i].getAttribute('disabled'))
                btns[i].removeAttribute('disabled')
            else
                btns[i].setAttribute('disabled', true)
        }
    }
	var modals = window.modals = {}
	var modalAnimation = 121

	function insertAfter(referenceNode,newNode){
		referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
	} //inserts a Node after a Node

	function shrinkFacets(current, parent){
		p_style = parent.style
		c_style = current.style
		c_style.marginLeft= p_style.marginLeft + "5%"
		c_style.marginRight= p_style.marginRight+ "5%"
		c_style.width = p_style.width - "5%"
	} //Creates a subfacet (a la search page) so
	// that the subfacets shrunk versions of their parents

	function appendChildren (par,list){
			for(var i=0;i<list.length;i++){
				par.appendChild(list[i])
			}
		}
	//appends a list of children to a node

    function findModal(node) {
        if (node.classList.contains('modal') ||
            node.classList.contains('confirm'))
            return node
        else if (node.classList.contains('dyn-modal'))
        	return node
        else
            return findModal(node.parentNode)
    }

    function removeModal(evt) {
        // Close button is located in: div > div > closeBtn
        // but we cannot be sure of this, so loop upwards
        // until we find parent that is a modal.

        var modal = findModal(this.parentNode)
        document.body.removeChild(modal)
    }

    function closeButton() {
        var btn = el('div.close-btn', [''])
        btn.addEventListener('click', removeModal, false)
        return btn
    }

    function cancelButton() {
        var btn = el('button.btn', ['cancel'])
        btn.addEventListener('click', removeModal, false)
        return btn
    }

	modals.exportModal = function(selectedEntries, collections) {
       	var options = []
       	var index = Object.keys(collections)
       	var editBtn = el('div.edit-btn', ['use existing'])
       	var createBtn = el('div.edit-btn', ['create new'])
       	var input = el("input#exportInput.large-input", {
			placeholder: 'new collection name',
			type: 'text',
			name: 'input'
		})

       	var select = el("select#exportSelect", [
			index.map(idx => el("option", {
				value: collections[idx].id,
				name: collections[idx].name,
				text: collections[idx].name
			}))
		])

		var modal = el('div#modal.modal', [
			el('div', [
				el('div.modal-entry-type', ['export entries (' + selectedEntries.length + ')']),
				closeButton(),
				el('div.modal-header-title', ['select collection']),
				el("div.modal-divider"),
				input,
				createBtn,
				el("div.modal-divider"),
				select, editBtn
			])
		])

		function submitToCollection(cID) {
            var url = window.user.collectionUrl(cID)
            selectedEntries.forEach(eID => {
            	window.user.putIntoCollection(url, eID)
            })
            document.body.removeChild(modal)
        }

		createBtn.addEventListener('click', (evt) => {
		  	window.user.createCollection($('#exportInput').val())
               .done(cID => {
                submitToCollection(cID.id)
            })
	    })

		editBtn.addEventListener('click', (evt) => {
		    submitToCollection($('#exportSelect').val())
	    })

		setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
        document.body.appendChild(modal)
	}

	/* Inspect facets modal */
	modals.infoModal = function(facet, unique) {
		var facets = unique.map(uniq => el("li.modal-li", [uniq]))

		var modal = el('div#modal.modal', [
			el('div', [
				el('div.modal-entry-type', ['inspecting entities']),
				closeButton(),
				el('div.modal-header-title', [facet]),
				el("div.modal-divider"),
				el('ul.modal-ul'),
				facets,
				el('ul.modal-ul')
			])
		])

        document.body.appendChild(modal)
        setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
	 }

	 /* Inspect facets modal with taxonomy extension for collection */
	modals.dynamicInfoModal = function(facet, newClass, subFac, dynEntries, CID, serpTaxonomy) {       
        var FACET = facet.toUpperCase()

		//implement dynamic loading.
		function moveEntry(location,destination){
			var dest = document.getElementById(destination)
			var loc = document.getElementById(location)
			dest.appendChild(loc)
		}

		function generate_DropDown (i){
			var x = document.getElementsByClassName("dropdown-show")
			var values = document.getElementsByClassName('dyn-modal-header-title')
			var newEntryDropDown =
					el("select.dropDowns", {id:"select"+i}, [
						el("option", {value: facet}, [facet]),
						subFac.taxonomy.filter(x => x.parent === FACET)
                                        .map(e => el("option", {value: e.id}, [e.name]))

					])
			
			newEntryDropDown.addEventListener('change', evt => {
				var row = $(evt.target).parent().parent().attr('id');
				var moveTo = evt.target.value+"-entry-container";
				moveEntry(row, moveTo);
			}) //creates the dropdown list
 			return newEntryDropDown
		}

		if (newClass.length != 0){
			var head = newClass[0];
			var facets = head.text.map((uniq,i) =>
				makeEntity(uniq)
			)
		}
		
		function setDropdownValues(parentID){
			var children = document.getElementById(parentID+"-entry-container").children
			for(var i = 0; i < children.length; i++){
				var entry = children[i];
				entry.children[0].children[0].value = parentID
			}
		}

		function makeEntity(uniq){
			return el('div#entry'+getIdFromEntity(uniq),[
						el("li.modal-li", [generate_DropDown(getIdFromEntity(uniq)), " " + uniq])
			])
		}

		function getIdFromEntity(name){
			for(var i = 0; i < dynEntries.length; i++){
				if(dynEntries[i].text == name){
					return dynEntries[i].id
				}
			}
		} 			

		var subLevel = el('div.add-facet-container',[
					el('div.add-facet', []),
					el('div.add-facet-text',["add sub facet"]),
					] )
		var saveBtn = el('button.btn', ['save'])

		var modal = el('div#modal.dyn-modal', [
			el('div', [
				el('div.modal-entry-type', ['inspecting entities']),
				closeButton(),
				el('div#'+facet+'.facet-container',[
					el("div.modal-divider"),
					el('div.dyn-modal-header-title', [facet]),
					subLevel,
					el("div#"+facet+"-entry-container.entry-container",[
						facets
					])
				]),
				el('div.dyn-modal-button-wrapper',[
					saveBtn,
					cancelButton()
				])
			])
		])

		subLevel.addEventListener('click', (evt) => {
			generate_textBox()
		})

		function generate_newFacet(current, id, name){
			removeBtn = el('div.modal-remove-facet', [])
      		removeBtn.addEventListener('click', (evt)=>{
      			var heading = evt.target.parentNode
						$(".dropDowns option[value='"+heading.id+"']").remove();
      			var entryContainer= document.getElementById(heading.id+'-entry-container')
      			var children = GetFacetChildren(entryContainer)
      			removeFacet(children)
      			heading.remove()
      		})
      		var newFacet = el('div#'+id+'.facet-container', { 'data-name': name }, [
      								// el("div.modal-divider"),
									el('div.dyn-modal-header-title',[String(name)] ),
									removeBtn,
									el("div#"+id+"-entry-container.entry-container",[
										])
								])
	      	var refNode = current
  			insertAfter(refNode,newFacet)
  			shrinkFacets(newFacet, refNode)
		}

		function generate_textBox(){
	      window.modals.addTextBox( function (newid,newname) {
	      	if(newIDisValid(newid)) {
                newid = newid.toUpperCase()
				var option = $("<option></option>")
                    .attr("value",newid)
                    .text(newname);
				$(".dropDowns").append(option);
	      		var newNode = new window.taxFunc.Node(newid,newname,facet)
	      		//removes facet and appends current entries to root facet
	      		var facets = document.getElementsByClassName('facet-container')
	      		for(var i=0; i < facets.length;i++){
	      			var current = facets[i]
		      		if(current.id === newNode.parent){
		      			generate_newFacet(current, newNode['id'], newNode.name)
		      			document.body.removeChild(this)
		      			return
		      		}
		      	}
		     }
		     else{
		     	document.getElementById("confirm").parentNode.appendChild(
		     		el("div.complaint", {text:"That name already exists"})
		     	)
		     }
	      })
	    }

	    function newIDisValid(newid){
            var newId = newid.toUpperCase()

            //checks against dyn taxonomy facets
            var inSub = subFac.taxonomy
                .filter(facet => facet.id.toUpperCase() === newId)

            if (inSub.length > 0)
                return false
            
	   		// checks against base taxonomy
            if (serpTaxonomy.root.dfs(newId))
                return false

	   		//checks against newly created facets
	   		var inNew = Array.from(document.getElementsByClassName('facet-container'))
               .filter(el => el.id.toUpperCase() === newId)
            
            if (inNew.length > 0)
                return false
            
            return true
	   }

	   function GetFacetChildren(facet){
            //takes element as input
            var list =[]
	   		var entries = facet.children
            for (var i =0;i < entries.length; i++){
                list.push(entries[i])
            }
      		return list
	    } //returns a list of all children elements which are entries

	    //puts all entries back to root facet
	    function removeFacet(children){
	    	while(children.length!=0){
      			var current = children.shift()
      			moveEntry( current.id, facet+"-entry-container")
   			}
	    }

	    //takes in entity string and returns it's facetid in db
	    function getEntityOrigin(entity){
	    	for(var i = 0; i < newClass.length; i++){
	    		for(var j = 0; j < newClass[i].text.length; j++){
	    			if(newClass[i].text[j] == entity){
						return newClass[i].facetId
					}
	    		}
			}
	    }

	    saveBtn.addEventListener("click", function(evt) {
	    	//only save entries for sub facets- otherwise set to root
			for (var i = 0; i < subFac.taxonomy.length; i++) {
				var current = subFac.taxonomy[i]
				if (current.parent === FACET) {
					subFac.taxonomy.splice(i--, 1)
				}
			} //removes all subfacets with current.parent = facet from backend dynamic taxonom 
			
			//reclassifies entities
			var facets = document.getElementsByClassName('facet-container')
			for (var i =0;i < facets.length; i++){
				var current = facets[i].id
                var x = document.getElementById(current+"-entry-container")
                var children = GetFacetChildren(x)

                children.forEach( function(child){
                    var text = child.innerText.trim()
                    var origin = getEntityOrigin(text)
                    var childId = child.id.substring(5);
                    var Ent = { 
                        oldFacetId: origin, 
                        newFacetId: current.toUpperCase(),
                        entities: [childId]	
                    }
                    window.api.json("POST", window.api.host + "/v1/collection/"+CID+"/reclassify", Ent)
                })
      		} 
              
      		//sorts out dynamic taxonomy
			for (var i = 0; i < facets.length; i++){
				var current = facets[i].id

				if(current.toUpperCase() === FACET)
                    continue

                subFac.taxonomy.push({
                    id: current.toUpperCase() ,
                    name: facets[i].dataset.name, 
                    parent:FACET
                })
      		}

            window.api.json("PUT", window.api.host + "/v1/collection/"+CID+"/taxonomy", subFac)
      		document.body.removeChild(modal)
        });

        document.body.appendChild(modal)
        setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)

        //start from 1 as root already created
        
        subFac.taxonomy.forEach( (tax,i) => {
            // tax={id, parent, name}
        	if(tax.parent.toLowerCase() === facet.toLowerCase()){
	            generate_newFacet(document.getElementById(facet), tax.id, tax.name)
                var index = 0
	            while(index < newClass.length){
	            	if (newClass[index].facetId.toLowerCase() === tax.id.toLowerCase()){
	            		var entities = newClass[index].text.map((id) =>
						makeEntity(id))
						appendChildren( document.getElementById(tax.id+"-entry-container"), entities)
						setDropdownValues(tax.id)
						break;
	            	}
	            	index++
	            }
			}
        })
	}

	 modals.addTextBox = function(method) {
	 	var inputboxes =
			[el('input#inputBox0.modal-input-box', {
					name: "input0",
					type: "text",
					placeholder: "short identifier for subfacet.."
			}),
			el('input#inputBox1.modal-input-box', {
				name: "input1",
				type: "text",
				placeholder: "full title for subfacet.."
			})]

		var confirmBtn = el('button#confirm.btn', ['confirm'])

		var modal = el('div#modal.modal.textBox.appear', [
			el('div#centerTextBox', [
				closeButton(),
				el("div.modal-header-title", ["add subfacet to "] ),
				el("div#bottom-divider.modal-small-divider"),
				inputboxes,
				el("div#bottom-divider.modal-small-divider"),
				confirmBtn, cancelButton()
			])
		])

		confirmBtn.addEventListener('click', (evt)=> {
			// document.body.removeChild(modal)
			var args = inputboxes.map(input => input.value)
            method.apply(modal, args)
		})

		document.body.appendChild(modal)
	}

/**
	 * Create a modal that displays allows extension of a taxonomy for a given collection
     * div.classification
     *     div.node
     *         span "Effect"
     *         div.leaf
     *             div.header
     *                 label "Solve new problem"
     *                 input "[x]"
     *             div.additional-data "click to add description +"
     *             div.entity-sample
     *                 input
     *                 div.remove "x"
	 * */
	modals.taxonomyModal = function(cID, name) {
       	var saveBtn = el('button#saveBtn.btn', ['save'])
   	    var taxonomy = new Taxonomy([])
   	    // var name = el('span', [name])
	    var cxx = el('div.classification#classification', taxonomy.tree().map(
	        function build(node, i) {
	            if (node.isTreeLeaf()) {
	                return el("div.leaf", [
	                    el("div.header", [
	                        el("label", [node.name()]),
	                      	 window.taxFunc.generate_button()
	                    ])
	                ])
	            } else {
	                return el("div.node", [
	                    el("span", [node.name()]),
	                    node.map(build).sort(window.taxFunc.byNbrOfChildren)
	                ])
	            }
	        }).sort(window.taxFunc.byNbrOfChildren)
	    )
	     var divider = el("div", [
	     	el("div.divider-wrapper", [
		        el("div.queued-divider", [""]),
		        el("div.divider-title", ["Extend Taxonomy for Collection " + name]),
		        el("div.queued-divider", [""])
		    ])
    	])
		var modal = el('div#modal.modal', [

			el('div',[
				divider,
				el('div.modal-entry-type'),
				el("div.modal-divider"),
				cxx,
				closeButton(),
				el('div.modal-header-title'),// [`collection #${cID}`]),
				el("div.modal-divider"),
				saveBtn,
				el("div"),
				cancelButton()
			])
		])

		saveBtn.addEventListener("click", function(evt) {
			taxFunc.save_taxonomy(cID)
			//To Do - change list to only save new nodes
        });

	    document.body.appendChild(modal)
        setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
	 }

	/**
	 * Create a modal that displays contents of an entry & an edit button.
	 *
	 * @param {object} entry 	straight from the API
	 * @param {object} taxonomy also straight from the API
	 * @param {object} options 	configure some stuff
	 *
	 * options.button = [buttonEl, ..., buttonEl]
	 *     - button elements are added after the edit button
	 * */
	modals.entryModal = function(CID, entry, taxonomy, options) {
        var classification = new Promise((resolve, reject) => {
            api.v1.entry.collection(entry.id).then(coll => {
                return Promise.all([
                    api.v1.taxonomy(),
                    api.v1.collection.taxonomy(coll.id)
                ]).then(data => {            
                    var serp = new Taxonomy(data[0].taxonomy)
                    var extension = data[1].taxonomy
                    
                    serp.extend(extension)
                    resolve(serp.classify(taxonomy))
                })
            })
        })
        .then(root => root.shake())
        .then(root => {
            function explore(node, depth) {
                if (node.isEntityLeaf())
                    return el("div.entity", [node.name()])

                var children = node.map((n, i) => explore(n, depth + 1))
                if (depth > 2)
                    return children
                
                return el("div.sublevel.level-" + depth, [
                    node.name(),
                    children
                ])
            }

            return el("div.root", [
                root && root.map((n, i) => explore(n, 0))
                || "Entry is not classified"
            ])
        })
        .then(html => {
            var editBtn = el('button#editBtn.edit-btn', ['edit'])
            var extraButtons = (options && options.button) || []
            var modal = el('div#modal.modal', [
                el('div',[
                    el('div.modal-entry-type', [entry.type]),
                    closeButton(),
                    el('div.modal-header-title', [`entry #${entry.id}`]),
                    el("div.modal-divider"),
                    html,
                    el("div.modal-divider"),
                    entry.type === "challenge" ? [
                        el('div.modal-header-title', ['Description']),
                        el('div.modal-sub-item', [entry.description]),
                        el("div.modal-divider")
                    ] : [
                        el('div.modal-header-title', ['References']),
                        el('div.modal-sub-item', [entry.reference]),
                        el('div.modal-header-title', ['DOI']),
                        el('div.modal-sub-item', [entry.doi]),
                        el("div.modal-divider")
                    ],
                    editBtn,
                    extraButtons
                ])
            ])

            editBtn.addEventListener("click", function(evt) {
                window.location = `/submit.html?e=${entry.id}`;
            });

            document.body.appendChild(modal)
            setTimeout(function(){
                document.getElementById('modal').classList.add('appear');
            }, modalAnimation)
        })
    }                


	/* Creates a modal with fuzzy search */
	modals.fuzzyModal = function(obj,method) {
		var message = [el("div.modal-sub-item", [obj.message])]
		var list = obj.list

		 itemsFuzzy = new Fuse(list, {
			threshold: 0.4
		 })

		 var inputboxes = obj.input.map((conf, i) => {
			return el(`input#input${i}.modal-input-box`, {
				name: conf[0],
				type: conf[1],
				placeholder: conf[2]
			})
		 })

		 //creates optional button
		 var button1 = el('button.btn', [obj.btnText])

		 // Creates the fuzzy item divs
		var div = el('div.items-container');
		var emailMappings = {};
		var i = 0;
		list.forEach(item => {
			var innerDiv = document.createElement('div');
			innerDiv.className = 'item';
			innerDiv.innerHTML = item;
			emailMappings[i] = innerDiv;
			div.appendChild(emailMappings[i]);
			i++;
		})

		var modal = el('div#modal.modal', [
			el('div', [
				closeButton(),
				el("div.modal-header-title", [obj.desc]),
				//name of modal
				el("div.modal-divider"),
				message,
				inputboxes,
				el("div#search-divider.modal-divider"),
				div,
				el("div#bottom-divider.modal-divider"),
				button1, cancelButton()
			])
		 ])

		button1.addEventListener('click', (evt) => {
			//maybe apply toggleButtonState() ??
			var args = inputboxes.map(input => input.value)
			method.apply({modal}, args)
		})

		document.body.appendChild(modal)
		// Focus on first input element
		if (obj.input.length > 0) {
				inputboxes[0].focus()
		}
		setTimeout(function() {
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)

		$("#input0").on("input", function(evt) {
			var searchString = $(this).val();
			if (searchString) {
				$(".item").hide();
				var results = itemsFuzzy.search(searchString);
				if (results.length) {
					for (var i = 0; i < results.length; ++i) {
						var matchingEmail = results[i];
						$(emailMappings[matchingEmail]).show();
					}
				}
			} else {
				$(".item").show();
			}
		});
	}

    /**
     * Create configurable modal.
     *
     * obj = {
     *     desc   : 'description',
     *     message: 'message',
     *     input  : [inputConf, ..., inputConf],
     *     btnText: 'ok button text'
     * }
     *
     * inputConf = [input-name, input-type, input-placeholder]
     *
     * Method is called when ok button is clicked. It is called
     * with modal as context and input values are arguments.
     *
     **/
    modals.optionsModal = function(obj, onConfirm, onCancel) {
        var message = [el("div.modal-sub-item", [obj.message])]

        var inputboxes = (obj.input || []).map((conf, i) => {
            return el(`input#input${i}.modal-input-box`, {
                name: conf[0],
                type: conf[1],
                placeholder: conf[2]
            })
        })

        //creates optional button
        var button1 = el('button.btn', [obj.btnText])
		var cancelBtn = cancelButton()

        var modal = el('div#modal.modal', [
            el('div', [
                closeButton(),
                el("div.modal-header-title", [obj.desc]),
                //name of modal

                el("div.modal-divider"),
                message,
                inputboxes,

                el("div#bottom-divider.modal-divider"),
                button1, cancelBtn
            ])
        ])

        button1.addEventListener('click', (evt) => {
            //maybe apply toggleButtonState() ??
            var args = inputboxes.map(input => input.value)
            onConfirm.apply(modal, args)
        })

		cancelBtn.addEventListener('click', (evt) => {
			if (onCancel)
				onCancel.apply(modal)
		})

        document.body.appendChild(modal)
		setTimeout(function() {
			modal.classList.add('appear');
		}, modalAnimation)

        // Focus on first input element
        if (obj.input && obj.input.length) {
            inputboxes[0].focus()
        }

        return modal
    }


	modals.confirmDeleteOwnerPopUp = function (obj, method) {
		var list = obj.list || [];

		var confirmBtn = el('button#confirm.btn', ['confirm'])
		var modal = el('div#modal.modal.appear', [
			el('div', [
				closeButton(),
				el("div.modal-header-title", [obj.desc]),
				el("div.modal-divider"),
				el("div", [obj.message]),
				el('p.modal-sub-item', [
					list.map(item => el('div', ['· ' + item]))
				]),
				el("div", [obj.bottomMessage]),
				el("div#bottom-divider.modal-divider"),
				confirmBtn, cancelButton()
			])
		])

		confirmBtn.addEventListener('click', (evt) => {
			method.apply({ modal })
		})

		document.body.appendChild(modal)
	}

	/* Create simple modal */
	modals.confirmPopUp = function(desc, onConfirm) {
		var modal = modals.optionsModal({
			desc: desc,
			message: "",
			input: [],
			btnText: 'confirm'
		}, onConfirm)
        modal.classList.add('confirm')
	}

		 /* Create simple modal with unique id */
 	    modals.confirmKickPopUp = function(desc, method) {
 	      var confirmBtn = el('button#confirm.btn', ['confirm'])
 	      var modal = el('div#modalConf.modal.confirm', [
 	              	el('div', [
 	                closeButton(),
 	                el("div.modal-header-title", [desc]),
 	                //name of modal
 	                el("div#bottom-divider.modal-divider"),
 	                confirmBtn, cancelButton()
 	            ])
 	          ])

 	        confirmBtn.addEventListener('click', (evt) => {
 	            method.apply({modal})
 	        })

 	      setTimeout(function(){
 				  document.getElementById('modalConf').classList.add('appear');
 				  document.getElementById('modalConf').classList.add('confirm');
 					//document.getElementsByClassName("modal confirm appear").style.zIndex = "1051";


 				//	alert($(this).data('id'))
 	      }, modalAnimation)

 	      document.body.appendChild(modal)
 		 }

	modals.clearAll = function() {
		var modal = document.querySelector('.modal')
		while (modal){
			modal.parentNode.removeChild(modal)
			modal = document.querySelector('.modal');
		}

		var confirm = document.querySelector('.confirm')
		if (confirm)
			confirm.parentNode.removeChild(confirm)
	}

	modals.clearTop = function(){
		var modal = document.querySelector('.modal')
		if (modal)
			modal.parentNode.removeChild(modal)
	}

	modals.clearConfirm = function(){
		var confirmModal = document.querySelector('#modalConf')
		if (confirmModal)
			confirmModal.parentNode.removeChild(confirmModal)
	}



	 //adds entries to a modal and returns the id of the entry that got clicked
	 modals.listModal = function(obj, method) {
		var message = [el("div.modal-sub-item", [obj.message])]
		// The X in the top-right corner

		var entries = obj.input.map(entry => {
			var elEntry = el('div.modal-option-li', {
				'data-entry-id': entry.id
			}, [entry.description || entry.reference || entry.DOI])

			elEntry.addEventListener('click', (evt) => {
				var args = [entry.id];
				document.body.removeChild(modal)
				method.apply({modal}, args)
			});

			return elEntry;
		});

		//cancel button is a standard feature
		var modal = el('div#modal.modal', [
			el('div', [
				closeButton(),
				el("div.modal-header-title", [obj.desc]),
				//name of modal

				el("div.modal-divider"),
				message,
				entries,

				el("div#bottom-divider.modal-divider"),
				cancelButton()
			])
		])

		document.body.appendChild(modal)
		setTimeout(function() {
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
	}
})

window.addEventListener('load', () => {
	document.body.addEventListener('click', (evt) => {
		var remove = evt.target.classList.contains('modal') ||
					 evt.target.classList.contains('confirm') ||
					 evt.target.classList.contains('dyn-modal')
		if (remove)
			document.body.removeChild(evt.target)
	}, false)

	// Remove active modals when pressing ESC
	document.addEventListener('keydown', (evt) => {
		if (evt.keyCode !== 27)
			return

		window.modals.clearAll()
	}, false)
}, false)
