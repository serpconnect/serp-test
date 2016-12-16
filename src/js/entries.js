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
        }).fail(xhr => window.alert(xhr.responseText))
    }

    function insertIntoTable(entry, position) {
        var classification = entry["serpClassification"];

        // let's build the table row for this entry
        var maxLength = 35;
        var entryTitle = entry["description"] || entry["reference"];
        entryTitle = entryTitle.length > maxLength ?
            entryTitle.substring(0, maxLength - 3) + "..." :
            entryTitle.substring(0, maxLength);

        var acceptBtn = el("button.entries-accept-btn", ["accept"]);
        acceptBtn.addEventListener("click", function(evt) {
            
            var entryNumber = this.parentNode.children[0].dataset.entryNumber
            commit(entryNumber, 'accept')
        }, false);

        var rejectBtn = el("button.entries-reject-btn", ["reject"]);
        rejectBtn.addEventListener("click", function(evt) {
            var entryNumber = this.parentNode.children[0].dataset.entryNumber
            commit(entryNumber, 'reject')
        }, false);

        var row = el('tr', [
            el('td', {'data-entry-number': entries.indexOf(entry) }, [entryTitle]),

            createCell("intervention", true),

            // effect
            createCell("solving"),
            createCell("adapting"),
            createCell("assessing"),
            createCell("improving"),

            // scope
            createCell("planning", true),
            createCell("design", true),
            createCell("execution", true),
            createCell("analysis", true),

            // context
            createCell("people"),
            createCell("information"),
            createCell("sut"),
            createCell("other"),

            acceptBtn,
            rejectBtn
        ])

        // insert the row into the specified position
        if (position) {
            $("#entries-table tbody tr:nth-child(" + position + ")").replaceWith(row);
        } else {
            // append row to the end of the table
            document.getElementById("table-body").appendChild(row);
        }

        // refresh on-click listeners for all entries in first column;
        // (a click initiates an entry inspection)
        $("td:first-child").unbind("click").on("click", function(evt) {
            var entryNumber = $(this).data("entry-number");
            var entry = entries[entryNumber];
            buildModalView(entry, entryNumber);
        });

        function createCell(subfacet, alternating) {
            return el(`td${classification[subfacet.toUpperCase()] ? '.filled-cell' : ''}${alternating ? '.alternating-group' : ''}`)
        }
    }

    // convenience function for capitalizing sentences
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    function buildModalView(entry, entryNumber) {
        var acceptBtn = el("button.btn", ["accept"]);
        acceptBtn.addEventListener("click", function(evt) {
            commit(entryNumber, 'accept')
        }, false);

        var rejectBtn = el("button.btn", ["reject"]);
        rejectBtn.addEventListener("click", function(evt) {
            commit(entryNumber, 'reject')
        }, false);

        var modalOpt = {
            button: [acceptBtn, rejectBtn]
        }

        modals.entryModal(entry, entry.serpClassification, modalOpt)
    }

    function removeEntry(entryNumber) {
        var num = Number(entryNumber)
        
        console.log('remove', num, $("#table-body tr:nth-child(" + (num + 1) + ")"))
        // remove the entry from the table
        $("#table-body tr:nth-child(" + (num + 1) + ")").remove();

        // remove from our internal array
        entries.splice(num, 1);

        // update data attribute of the table cells after the removed entry
        var cells = document.querySelectorAll("td:first-child")
        for (var i = num; i < cells.length; i++) {
            console.log(i, cells[i], cells[i].dataset)
            cells[i].dataset.entryNumber = cells[i].dataset.entryNumber - 1
        }
    }

});
