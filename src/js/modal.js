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
	}

	function shrinkFacets(current){
		parent = document.getElementById(current['parent']).style
		child =document.getElementById(current['short']).style
		child.marginLeft= parent.marginLeft + "5%"
		child.marginRight= parent.marginRight+ "5%"
		child.width = parent.width - "5%"
	}

	function appendChildren (par,list){
			for(var i=0;i<list.length;i++){
				par.appendChild(list[i])
			}
		}

    function findModal(node) {
        if (node.classList.contains('modal') ||
            node.classList.contains('confirm'))
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
	modals.dynamicInfoModal = function(facet, unique) {

 	dropDownMenu = function(){
		var dropDownFacets = document.getElementsByClassName('modal-header-title')
		var list =[]
		for(var i=0;i<dropDownFacets.length;i++){
			var cur = dropDownFacets[i].innerHTML
			a = el('a', {
					text:cur,
					onClick:"alert()"
				}) 
			list.push( a ) 
			// a.addEventListener('click', (evt) => {
			// 	evt.target.innerHTML
			// }
			list.push( a )
		}
		return list
		}
		
		function getDropFacets(evt){
				appendChildren(evt.target.children[0], dropDownMenu())
				evt.target.children[0].classList.toggle("dropdown-show");
		}

		generate_DropDown =function(){
			newEntryDropDown = 
							el('div.entry-dropDown',[
								el('div.entry-dropDownBtn',[ 
								  el( 'div.entry-dropDown-content', []) 
								])
							])

			newEntryDropDown.addEventListener('click', function(evt) {
				getDropFacets(evt)
			})

			return newEntryDropDown
		}

		var facets = unique.map(uniq =>
							el('div',[
									el("li.modal-li", [uniq]),
									generate_DropDown()
								])
							)
							
		// var addButton = el('div.add-facet', [])
		var subLevel = el('div',[
					el('div.add-facet', []),
					el('div.add-facet-text',["add sub facet"]),
					] )

		var modal = el('div#modal.modal', [
			el('div', [
				el('div.modal-entry-type', ['inspecting entities']),
				closeButton(),
				el('div#'+facet+'.facet-container',[
					el('div.modal-header-title', [facet]),
					subLevel,
					el("div.modal-divider")
					]),
				el('ul.modal-ul'),
				facets,
				el('ul.modal-ul')
			])
		])

		subLevel.addEventListener('click', (evt) => {
			generate_textBox()
		})	

		generate_textBox = function (){
	      window.modals.addTextBox( function (newshort,newlong) {
	      		//To DO - push to back end, then update modal.
      		var newNode = new window.taxFunc.Node(newshort,newlong,facet)
      		// header = newNode['short']
      		var facets = document.getElementsByClassName('modal-header-title')
      		for(var i=0; i < facets.length;i++){
      			var current = facets[i]
	      		if(current.innerHTML==newNode['parent']){
	      			var newFacet = el('div#'+newNode['short']+'.facet-container',[	
									el('div.modal-header-title',[ newNode['short'] ] ),
									el("div.modal-divider")
								])
	      			var refNode = current.nextSibling.nextSibling
	      			insertAfter(refNode,newFacet)
	      			shrinkFacets(newNode)
	      			return
	      		}
	      	}
	    })
	  }

        document.body.appendChild(modal)
        setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
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
			document.body.removeChild(modal)
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
	modals.entryModal = function(entry, taxonomy, options) {
       	var editBtn = el('button#editBtn.edit-btn', ['edit'])
		var extraButtons = (options && options.button) || []
		console.log(taxonomy)
		var modal = el('div#modal.modal', [
			el('div',[
				el('div.modal-entry-type', [entry.type]),
				closeButton(),
				el('div.modal-header-title', [`entry #${entry.id}`]),
				el("div.modal-divider"),
				window.central.constructFacet(taxonomy, "Intervention"),
				window.central.constructFacet(taxonomy, "Effect"),
				window.central.constructFacet(taxonomy, "Scope"),
				window.central.constructFacet(taxonomy, "Context"),
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
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)

        // Focus on first input element
        if (obj.input && obj.input.length) {
            inputboxes[0].focus()
        }
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
		modals.optionsModal({
			desc: desc,
			message: "",
			input: [],
			btnText: 'confirm'
		}, onConfirm)
		setTimeout(function() {
			document.getElementById('modal').classList.add('confirm');
		}, modalAnimation)
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
					 evt.target.classList.contains('confirm')
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
