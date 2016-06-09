$(document).ready(function() {
    $("#login").text("profile");
    $("#login").addClass("current-view");

    // stores all the queued entries
    var entries = [];
    window.api.ajax("GET", window.api.host + "/v1/admin/pending").done(pending => {
        pending.forEach(entry => {
            window.api.ajax("GET", window.api.host + "/v1/entry/" + entry.id + "/taxonomy").done(taxonomy => {
                entries.push(entry)
                entry.serpClassification = taxonomy
                insertIntoTable(entry)
            })
        })
    }).fail(xhr => {
        if (xhr.status === 403)
            window.location = "/profile.html"
        else
            window.location = "/login.html"
    })

    function commit(entryNumber, action) {
        window.api.ajax("POST", `${window.api.host}/v1/admin/${action}-entry`, {
            entry : entries[entryNumber].id
        }).done(ok => {
            $(".modal").remove();
            removeEntry(entryNumber);
        }).fail(reason => window.alert(reason))
    }

    function insertIntoTable(entry, position) {
        var classification = entry["serpClassification"];

        // let's build the table row for this entry
        var $row = el("tr");
        var maxLength = 35;
        // choose as the row descriptor either the project name, description
        // (for challenges), or the reference (for research results)
        var entryTitle = entry["description"] || entry["reference"];
        entryTitle = entryTitle.length > maxLength ?
            entryTitle.substring(0, maxLength - 3) + "..." :
            entryTitle.substring(0, maxLength);
        var titleCell = el("td").text(entryTitle);
        titleCell.data("entry-number", entries.indexOf(entry));

        $row.append(titleCell);
        $row.append(el("td").addClass("alternating-group").text(entry.collection));

        createCell("intervention");

        // effect
        createCell("solving");
        createCell("adapting");
        createCell("assessing");
        createCell("improving");

        // scope
        createCell("planning", true);
        createCell("design", true);
        createCell("execution", true);
        createCell("analysis", true);

        // context
        createCell("people");
        createCell("information");
        createCell("sut");
        createCell("other");

        var $acceptBtn = el("td").append(el("button").addClass("entries-accept-btn").text("accept"));
        $acceptBtn.on("click", function(evt) {
            var entryNumber = $($(this).closest("tr").children()[0]).data("entryNumber");
            commit(entryNumber, 'accept')
        });
        $row.append($acceptBtn);

        var $rejectBtn = el("td").append(el("button").addClass("entries-reject-btn").text("reject"));
        $rejectBtn.on("click", function(evt) {
            var entryNumber = $($(this).closest("tr").children()[0]).data("entryNumber");
            commit(entryNumber, 'reject')
        });
        $row.append($rejectBtn);

        // insert the row into the specified position
        if (position) {
            $("#entries-table tbody tr:nth-child(" + position + ")").replaceWith($row);
        } else {
            // append row to the end of the table
            $("#table-body").append($row);
        }

        // refresh on-click listeners for all entries in first column;
        // (a click initiates an entry inspection)
        $("td:first-child").unbind("click").on("click", function(evt) {
            var entryNumber = $(this).data("entry-number");
            var entry = entries[entryNumber];
            buildModalView(entry, entryNumber);
        });

        function createCell(subfacet, alternating) {
            var $td = el("td");
            classification[subfacet.toUpperCase()] ? $td.addClass("filled-cell") : "";
            alternating ? $td.addClass("alternating-group") : "";
            $row.append($td);
        }
    }

    // convenience function for capitalizing sentences
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    function buildModalView(entry, entryNumber) {
        var $modal = el("div").addClass("modal");
        var $close = el("div").addClass("close-btn");
        $close.on("click", function(evt) {
            // remove the modal view
            $(".modal").remove();
        });

        // remove if the user clicks outside the inspection view
        $("body").on("click", function(evt) {
           if (evt.target.className === "modal") {
                $(".modal").remove();
            }
        });

        // remove modal view if escape key is pressed
        $(document).keydown(function(e) {
            if (e.keyCode === 27) {
                $(".modal").remove();
            }
        });

        var $content = el("div");
        // add close btn
        $content.append($close);

        // start filling the view with entry data
        $content.append(el("div").addClass("modal-entry-type").text(entry["type"]));
        $content.append(el("div").addClass("modal-entry-title").text(entry["contact"]));
        $content.append(el("div").addClass("modal-entry-title").text(entry["collection"]));
        $content.append(el("div").addClass("modal-divider"));

        // populate the classification data
        var classifications = entry["serpClassification"];
        var scope = ["planning", "design", "execution", "analysis"];
        var effect = ["solving", "adapting", "assessing", "improving"];
        var context = ["sut", "information", "people", "other"];

        // map the data name shorthands to their actual names
        var shorthandMap = {
                "adapting": "Adapt testing",
                "solving": "Solve new problem",
                "assessing": "Assess testing",
                "improving": "Improve testing",
                "planning": "Test planning",
                "design": "Test design",
                "execution": "Test execution",
                "analysis": "Test analysis",
                "people": "People related constraints",
                "information": "Availability of information",
                "sut" : "Properties of SUT",
                "other": "Other"
        }

        function handleFacetMatch(facetName, subfacet) {
            if (!classifiedItems[facetName]) {
                var $facet = el("div").addClass("modal-header-title").text(facetName.capitalize());
                classifiedItems[facetName] = $facet;
            }
            var $subfacet = el("div").addClass("modal-sub-sub-item").text(shorthandMap[subfacet.toLowerCase()]);
            var subfacetList = classifications[subfacet];
            for (var i = 0; i < subfacetList.length; i++ ) {
                var detailText = subfacetList[i]
                var $subfacetDetail = el("div").addClass("modal-sub-sub-item").text(detailText);
                $subfacet.append($subfacetDetail)
            }
            classifiedItems[facetName].append($subfacet);
        }

        var classifiedItems = {scope: null, effect: null, context: null};
        for (var subfacet in classifications) {
            if (classifications[subfacet]) {
                if (scope.indexOf(subfacet.toLowerCase()) >= 0) {
                    handleFacetMatch("scope", subfacet);
                } else if (effect.indexOf(subfacet.toLowerCase()) >= 0) {
                    handleFacetMatch("effect", subfacet);
                } else if (context.indexOf(subfacet.toLowerCase()) >= 0) {
                    handleFacetMatch("context", subfacet);
                } else {
                    // oh but wait, it does for intervention facet, otherwise true
                    console.log("this shouldn't ever happen; inside buildModalView()");
                }
            }
        }

        for (var facet in classifiedItems) {
            var $facet = classifiedItems[facet];
            if ($facet) {
                $content.append($facet);
            }
        }
        $content.append(el("div").addClass("modal-divider"));

        // deal with entry type specific information
        if (entry["entryType"] === "challenge") {
            $content.append(el("div").addClass("modal-header-title").text("Description"));
            $content.append(el("div").addClass("modal-sub-item").text(entry["description"]));
        } else {
            $content.append(el("div").addClass("modal-header-title").text("Reference"));
            $content.append(el("div").addClass("modal-sub-item").text(entry["reference"]));
            $content.append(el("div").addClass("modal-header-title").text("DOI"));
            $content.append(el("div").addClass("modal-sub-item").text(entry["doi"]));
        }

        var $acceptBtn = el("button").addClass("edit-btn").text("accept");
        $acceptBtn.on("click", function(evt) {
            commit(entryNumber, 'accept')
        });

        $content.append($acceptBtn);
        var $rejectBtn = el("button").addClass("edit-btn").text("reject");
        $rejectBtn.on("click", function(evt) {
            commit(entryNumber, 'reject')
        });
        $content.append($rejectBtn);

        var $editBtn = el("button").addClass("edit-btn").text("edit");
        $editBtn.on("click", function(evt) {
            window.location = "submit.html?e=" + entry.id
        });
        $content.append($editBtn);

        $modal.append($content);
        $("body").append($modal);

    }

    function removeEntry(entryNumber) {
        // remove the entry from the table
        $("#table-body tr:nth-child(" + (entryNumber + 1) + ")").remove();
        // remove from our internal array
        entries.splice(entryNumber, 1);
        // update data attribute of the table cells after the removed entry
        var $cells = $("td:first-child");
        $cells.splice(0, entryNumber);
        $cells.each(function(cell) {
            var $cell = $($cells[cell]);
            var oldEntryNumber = $cell.data("entryNumber");
            $cell.data("entryNumber", oldEntryNumber - 1);
        });
        // clear the input boxes
    }


// more efficient way of creating elements than purely using jquery;
// basically an alias for document.createElement - returns a jquery element
function el(elementType) {
    return $(document.createElement(elementType));
}
});
