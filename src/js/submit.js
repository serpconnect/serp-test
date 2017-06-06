$(document).ready(function() {

    window.addEventListener("beforeunload", function (e) {
      if(queuedEntries.length > 0){
         var message = "You have unsaved entries queued.\n\n"
            + "Do you still want to leave?";
         e.returnValue = message;
         return message;
      }
    });

    var loggedIn = false;
    window.api.ajax("GET", window.api.host + "/v1/account/login").done(user => {
      loggedIn = true;
    }).fail(xhr => {
      loggedIn = false;
    });

    var querystring = {}
    var collectionTaxonomy = undefined

    // find a more permanent fix for this
    // without setTimeout the additional-data elements don't appear in firefox,
    if (window.location.search) {
        var params = window.location.search.substring(1).split('&')
        for (var i = 0; i < params.length; i++) {
            var split = params[i].indexOf('=')
            var name = params[i].substring(0, split)
            var value = params[i].substring(split + 1)

            querystring[name] = value
        }
    }

    // set the little white line underneath the submit title
    $("#submit").addClass("current-view");

    function updateCollectionList() {
        return window.user.collections().done(collz => {
            var def = 0
            $("#collection")
                .empty()
                .append(collz.map(coll => {
                    if (coll.name === "default")
                        def = coll.id
                    return jqEl("option")
                        .text(coll.name)
                        .attr("value", coll.id)
                    })
                ).val(querystring.c || def)
            if (!querystring.e)
                selectCollection(querystring.c || def)
        })
    }
    updateCollectionList()

    //booleans to limit number of error messages
    var researchComplaint=false;
    var challengeComplaint=false;

    // load the requested entry if we have one
    var currentEntry = undefined
    if (querystring.e) {
        var eurl = window.api.host + "/v1/entry/" + querystring.e
        var entry = undefined
        Promise.all([
            api.v1.entry.collection(querystring.e),
            api.ajax("GET", eurl),
            api.v1.entry.taxonomy(querystring.e)
        ]).then(promise => {
            entry = promise[1]
            entry.entryType = entry.type
            entry.serpClassification = promise[2]
            currentEntry = entry

            return selectCollection(promise[0].id)
        }).then(() => {
            fillAccordingToEntry(entry, true)
        })
    }

    // clear all checkboxes upon refreshing the page
    $('input:checkbox').removeAttr('checked');

    // clear any cached data in the new collection field
    $("#new-collection").val("");

    // stores all the queued entries
    var queuedEntries = [];

    // fill each key with an array of strings for which to autocomplete on
    // current data is for illustration purposes
    var autocompleteMap = {};
    function getFacetEntities(facet) {
        return autocompleteMap[facet] || []
    }

    // load taxonomy for autocomplete purposes only
    function reloadAutocomplete(collectionId) {
        api.v1.collection.classification(collectionId)
            .then(classification => {
                for (var i = 0; i < classification.length; i++) {
                    var facet = classification[i]
                    var samples = facet.text.filter(txt => txt !== 'unspecified')
                    autocompleteMap[facet.facetId] = samples
                }
            })
    }

    function byNbrOfChildren (a, b) {
        return a.children.length - b.children.length
    }

    /* Generate a classification setup a la submit page */
    function classification_remove_row(evt) {
        var sample = this.parentNode
        sample.parentNode.removeChild(sample)
    }
    
    /* when user clicks the [+] of a facet */
    function classification_add_row(evt) {
        var remove = el("div.remove", ["✖"])
        remove.addEventListener('click', classification_remove_row) 

        var input = el('input')
        var row = el('div.entity-sample', [
            input,
            remove
        ])
        this.parentNode.appendChild(row)

        var facet = this.parentNode.querySelector('.header').dataset.facetId
        new Awesomplete( input, { 
            list: autocompleteMap[facet], 
            filter: ausomplete.autocompleteFilter, 
            replace: ausomplete.autocompleteUpdate
        })

        return row
    }

    /* when user changes the checkbox value of a facet */
    function classification_checkbox_click(evt) {
        var header = this.parentNode

        if (!this.checked) {
            /* the [+] and inputs are siblings to the header */
            while (header.nextSibling)
                header.parentNode.removeChild(header.nextSibling)
        } else {
            // TODO: Load text from somewhere
            var add = el("div.additional-data", ["click to add new leaf +"])
            add.addEventListener('click', classification_add_row, false)
            header.parentNode.insertBefore(add, header.nextSibling)
        }
    }
    
    function generate_checkbox () {
        var box = el("input", {type:"checkbox"})
        box.addEventListener('change', classification_checkbox_click, false)
        return box
    }

    function generateClassification(taxonomy) {
        /**
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
         */
        var clazz = el('div.classification#classification', taxonomy.tree().map(
            function build(node, i) {
                if (node.isTreeLeaf()) {
                    return el("div.leaf", [
                        el("div.header", {'data-facet-id': node.short}, [
                            el("label", [node.name()]),
                            generate_checkbox()
                        ])
                    ])
                } else {
                    return el("div.node", [
                        el("span", [node.name()]),
                        node.map(build).sort(byNbrOfChildren)
                    ])
                }
            }).sort(byNbrOfChildren))

        var div = document.querySelector('.submit-facets')
        while (div.firstChild)
            div.removeChild(div.lastChild)
        div.appendChild(clazz)
    }

    // the various categories that make up the effect facet
    var effectSubfacets = ["solving", "adapting", "assessing", "improving"];

    // show the corresponding input boxes depending on the previously set entry type
    var currentType = $(".circular-checkbox input:checked").val();
    if (currentType === "research") {
        $("#description-area").hide();

    } else if (currentType === "challenge") {
        $("#reference-area").hide();
        $("#doi-area").hide();
    }

    function submitEntry(entry) {
        var id = entry.id

        if (!id)
            return window.api.json("POST", window.api.host + "/v1/entry/new", entry)

        delete entry.id
        return window.api.json("PUT", window.api.host + "/v1/entry/" + id, entry)
    }

    function getClassification() {
        var classification = {}

        $(".header > input:checked").each(function() {
            var parent = this.parentNode
            var facet = parent.dataset.facetId
            var samples = Array.from(parent.
                parentNode.querySelectorAll(".entity-sample input"))
                .map(sample => sample.value)

            classification[facet] = samples || ['unspecified']
        });

        return classification;
    }

    function clearPageState() {
        clearInputBoxes();
        clearCheckboxes();
        clearComplaints();
    }

    function clearCheckboxes() {
        // iterate over each checkbox that has been checked
        $(".header > input:checked").each(function() {
            this.checked = false
            classification_checkbox_click.bind(this).call({})
        });
    }

    // clear input boxes (but leave collection selection intact for workflow reasons)
    function clearInputBoxes() {
        $("#doi").val("");
        $("#reference").val("");
        $("#description").val("");
    }

    // creates a table row with the data contained in entry
    function insertIntoTable(entry, position) {
        var classification = entry["serpClassification"];

        // let's build the table row for this entry
        var $row = jqEl("tr");

        // choose as the row descriptor either the description (for challenges)
        if (entry.entryType === "challenge") {
            var entryTitle = entry["description"];
        // or the reference (for research results)
        } else {
            var entryTitle = entry["reference"];
        }

        var entryNumber = position ? position : queuedEntries.length - 1;
        var scrollDiv = jqEl("div").text(entryTitle || entry["description"] || entry["reference"]);
        scrollDiv.addClass("table-cell-div")
        var wrapper = jqEl("div")
        wrapper.addClass("scroll-wrapper")
        wrapper.append(scrollDiv)
        var titleCell = jqEl("td")
        titleCell.append(wrapper)
        titleCell.data("entry-number", entryNumber);

        $row.append(titleCell);

        collectionTaxonomy.tree().map(function create(node, i) {
            if (!node.isTreeLeaf())
                node.map(create)
            else
                createCell(node.short)
        })

        // position + 2 rationale: nth-child(1) === table head
        // => we need to offset with 1
        // insert the updated row
        if (position!=null) {
            $("#queue-table tr:nth-child(" + (position + 2 /* to account for table header */) + ")").replaceWith($row);
        } else {
            // append row to the end of the table
            $("#queue-table tr:last").after($row);
        }

        // refresh on click listeners for all entries in first column;
        // this click initiates an inspection and possibly change of the entry
        // contents
        $("td:first-child").on("click", function(evt) {
            $("td:first-child").removeClass("selected-entry-in-queue");
            var entryNumber = $(this).data("entry-number");
            $("#submit-btn").data("currentEntry", entryNumber);
            var entry = queuedEntries[entryNumber];
            $(this).addClass("selected-entry-in-queue");
            discardEntryChanges();
            fillAccordingToEntry(entry);
        });

        function createCell(subfacet, alternating) {
            var $td = jqEl("td");
            classification[subfacet] ? $td.addClass("filled-cell") : "";
            alternating ? $td.addClass("alternating-group") : "";
            $row.append($td);
        }
    }

    function getEntry() {      
        var entry = {
            entryType: $(".circular-checkbox input:checked").val(),
            collection: $("#collection").val(),
            reference: $("#reference").val(),
            description: $("#description").val(),
            doi: $("#doi").val(),
            date: new Date(),
            serpClassification: getClassification(),
            id: currentEntry && currentEntry.id,
            contact: currentEntry && currentEntry.contact
        };
        currentEntry = undefined

        return entry;
    }

    function entryIsValid(entry) {
        if (entry.entryType == "research") {
            return entry.reference.length > 0;
        } else if (entry.entryType == "challenge") {
            return entry.description.length > 0;
        }
        return true;
    }

    function complain(entry) {
        if (entry.entryType == "research") {
            if (researchComplaint==false && entry.reference.length < 1) {
                researchComplaint=true;
                $("#reference-area").append(jqEl("div").addClass("complaint").text("please supply information"));
            }
        } else if (entry.entryType == "challenge") {
            if (challengeComplaint==false && entry.description.length < 1) {
                challengeComplaint=true;
                $("#description-area").append(jqEl("div").addClass("complaint").text("please supply information"));
            }
        }
    }

    //removes all error messages
    function clearComplaints() {
        $(".complaint").remove();
        researchComplaint=false;
        challengeComplaint=false;
    }

    function fillAccordingToEntry(entry, noswap) {
        // fill in the input fields
        for (var key in entry) {
            $("#" + key).val(entry[key]);
        }

        // toggle the correct radio button
        $("#" + entry["entryType"] + "-button").trigger("click");
        var classification = entry.serpClassification

        // fill in the correct checkboxes
        for (var key in classification) {
            var header = document.querySelector(`[data-facet-id="${key}"]`)
            
            var checkbox = header.querySelector('input')
            checkbox.checked = true
            classification_checkbox_click.bind(checkbox).call({})
            
            var leaf = header.parentNode
            var addData = leaf.querySelector('.additional-data')

            var entities = classification[key];
            if (entities[0] === "unspecified")
               continue

            // fill in the additional data that's been specified for the checkboxes
            for (var i = 0; i < entities.length; i++) {
                var row = classification_add_row.bind(addData).call({})
                row.querySelector('input').value = entities[i]
            }
        }
        
        if (!noswap)
            swapButtons();
    }

    function swapButtons() {
        $("#queue-btn").text("cancel");
        $("#submit-btn").text("save");
        $("#remove-btn").show();
    }

    function restoreButtons() {
        $("#queue-btn").text("queue");
        $("#submit-btn").text("submit");
        $("#remove-btn").hide();
    }

    function saveEntryChanges(entryNumber) {
        var editedEntry = getEntry();
        queuedEntries[entryNumber] = editedEntry;
        insertIntoTable(editedEntry, entryNumber);
    }

    function removeEntry(entryNumber) {
        // remove the entry from the table
        var position = Number(entryNumber) + 2;
        $("#queue-table tr:nth-child(" + position + ")").remove();
        // remove from our internal array
        queuedEntries.splice(entryNumber, 1);
        // update data attribute of the table cells after the removed entry
        var $cells = $("td:first-child");
        $cells.splice(0, entryNumber);
        $cells.each(function(cell) {
            var $cell = $($cells[cell]);
            var oldEntryNumber = Number($cell.data("entryNumber"));
            $cell.data("entryNumber", oldEntryNumber - 1);
        });
        // clear the input boxes
        discardEntryChanges();
    }

      function discardEntryChanges() {
        clearPageState();
        // clear data on submit-btn
        jQuery.removeData($("#submit-btn"), "currentEntry");

        // clear checkbox related stuff
        $('input:checkbox').removeAttr('checked');
        $(".additional-data").remove();
        $(".additional-data-wrapper").remove();

        // clear stuff related to creating a new collection
        $("#submit-create-collection").text("create a new collection");
    }

    /* All interactive/clickable elements */
    function getUIElements() {
        return ["#submit-queue-btn", "#submit-btn", "#queue-btn",
                "#load-btn", "#import-json-btn", "#collection",
                "#submit-create-collection"
        ]
    }
    /* Wrapper for toggling buttons */
    function disableButton(btn) {
        btn.disabled = true
        btn.classList.add('submit-disabled')
    }
    function enableButton(btn) {
        btn.disabled = false
        btn.classList.remove('submit-disabled')
    }
    function updateUI(enableDisable) {
        getUIElements().forEach(selector => {
            var btn = document.querySelector(selector)
            enableDisable(btn)
        })
    }

    /* Placeholder for something more legit */
    function flashErrorMessage(msg) {
        window.alert(`Error: ${msg}`)
    }

    /**
     * Goes through the queued entries and posts them to backend, disabling
     * the button while submitting to prevent multiple submissions. Will stop
     * when any entry didn't succeed, or when all entries were posted.
     */
    function submitQueue() {
        return new Promise(function startSubmit(resolve, reject) {
            var submitNext = function () {
                if (queuedEntries.length === 0) {
                    resolve()
                    return
                }

                // Post entries in the same order as the table
                var entry = queuedEntries[0]

                submitEntry(entry).fail(reject)
                .done(() => {
                    // Only remove entries if they are successfully added - improves workflow
                    removeEntry(0)
                    setTimeout(submitNext, 0)
                })
            }

            submitNext()
        })
    }

    $("#submit-queue-btn").on("click", function(evt) {
        updateUI(disableButton)

        submitQueue().catch(xhr => {
            flashErrorMessage(xhr.responseText)
        }).then(() => {
            updateUI(enableButton)
        })
    });

    var newCollectionModal = {
        desc: "create new collection",
        message: "",
        input: [['input0','text','collection name']],
        btnText: "Create"
    };

    $("#submit-create-collection").on("click", function(evt) {
        modals.optionsModal(newCollectionModal, function (name) {
            api.v1.collection.create(name)
                .done(ok => {
                    modals.clearAll()
                    querystring.c = ok.id
                    updateCollectionList()
                    reloadAutocomplete(ok.id)
                })
                .fail(xhr => {
                    $('.modal-complaint').remove()
                    var modal = document.querySelector(".modal") || document.querySelector(".confirm")
                    var error = modal.querySelector('#input0')
                    var complaint = el('div.modal-complaint', [xhr.responseText])
                    error.parentNode.insertBefore(complaint, error.nextSibling)
                })
        })
    });

    $("#submit-btn").on("click", function(evt) {
        var isSubmitBtn = this.textContent === "submit"
        if (isSubmitBtn) {
            var entry = getEntry()

            if (!entryIsValid(entry)) {
                complain(entry)
                return
            }

            updateUI(disableButton)
            submitEntry(entry).done(ok => clearPageState())
                .fail(xhr => {
                    flashErrorMessage(xhr.responseText)
                }).always(() => {
                    updateUI(enableButton)
                })
        // acts as save button
        } else {
            var entryNumber = $(this).data("currentEntry");
            saveEntryChanges(entryNumber);
            clearPageState();
            restoreButtons();
            discardEntryChanges();
        }
    });

    $("#load-btn").on("click", function(evt) {
        if(loggedIn){
          window.user.self().done(user => {
              var conf = {
                  desc: "Load an entry",
                  input: user.entries
              };
              window.modals.listModal(conf, function (entryId) {
                  api.v1.getEntry(entryId).done(entry => {
                        $("#" + entry.type + "-button").trigger("click");
                        api.v1.getTaxonomyEntry(entryId).done(taxonomy =>{
                          entry["serpClassification"] = taxonomy;
                          fillAccordingToEntry(entry, true);
                        })

                  }) // Only error if race condition?
              })
          }).fail(xhr => {
            flashErrorMessage(xhr.responseText);
          })
        } else {
          flashErrorMessage("Must be logged in");
        }
    });

    $("#queue-btn").on("click", function(evt) {
        var $thisEl = $(this);
        clearComplaints();
        // used as the queue button
        if ($thisEl.text() === "queue") {
            pushEntry(getEntry());
        // used as the cancel button
        } else {
            $("td:first-child").removeClass("selected-entry-in-queue");
            restoreButtons();
            discardEntryChanges();
        }
    });

    function pushEntry(entry){
        if (entryIsValid(entry)) {
          clearPageState();
          queuedEntries.push(entry);
          insertIntoTable(entry);
          discardEntryChanges();
        } else {
            complain(entry);
        }
    }

    $("#import-json-btn").on("click", function(evt) {
      if(loggedIn){
        window.import.fromFile(pushEntry);
      } else {
        flashErrorMessage("Must be logged in");
      }
    });

    $("#remove-btn").on("click", function(evt) {
        // data's stored in the submit button
        var entryNumber = $("#submit-btn").data("currentEntry");
        removeEntry(entryNumber);
        restoreButtons();
    });

    $("#toggle-queue").on("click", function(evt) {
        $("#queue-table").toggle();

        if ($("#toggle-queue").text().indexOf("hide") > -1) {
            $("#toggle-queue").text("show table");
            $("#toggle-chevron").removeClass("hide-chevron");
            $("#toggle-chevron").addClass("show-chevron");
        } else {
            $("#toggle-queue").text("hide table");
            $("#toggle-chevron").removeClass("show-chevron");
            $("#toggle-chevron").addClass("hide-chevron");
        }
    });

    // an entry type was chosen
    $(".circular-checkbox input").on("change", function(evt) {
        $("#reference-area").slideToggle();
        $("#description-area").slideToggle();
        $("#doi-area").slideToggle();
        clearComplaints();
    });

    function generateOverviewTable(taxonomy) {
        var div = document.getElementById('queue-table')
        while (div.firstChild)
            div.removeChild(div.lastChild)

        var thead = el('thead', [
            el('tr', [
                el('th'),
                taxonomy.tree().map(function build(node, i) {
                    if (!node.isTreeLeaf())
                        return node.map(build)
                    return el('th', [node.long])
                })
            ])
        ])

        div.appendChild(thead)
        div.appendChild(el('tbody'))
    }

    function selectCollection(id) {
        $("#collection").val(id)
        reloadAutocomplete(id)

        return Promise.all([
            api.v1.taxonomy(),
            api.v1.collection.taxonomy(id),
        ]).then(promise => {
            var taxonomy = new Taxonomy(promise[0].taxonomy)
            taxonomy.extend(promise[1].taxonomy)
            collectionTaxonomy = taxonomy
            return taxonomy
        })
        .then(taxonomy => {
            generateClassification(taxonomy)
            generateOverviewTable(taxonomy)
        })
    }

    document.getElementById("collection").addEventListener('change', function (evt) {
        selectCollection(this.value)
    }, false)

    // more efficient way of creating elements than purely using jquery;
    // basically an alias for document.createElement - returns a jquery element
    function jqEl(elementType) {
        return $(document.createElement(elementType));
    }

    function scrollDown(target){
        $("html, body").animate({ scrollTop: target }, 300);
    }

});
