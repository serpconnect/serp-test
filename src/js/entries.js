$(document).ready(function() {
    $("#login").text("profile");
    $("#login").addClass("current-view");

    // stores all the queued entries
    var entries = [];
    api.v1.admin.pending().done(pending => {
        pending.forEach(entry => {
            api.v1.entry.taxonomy(entry.id).done(taxonomy => {
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

    function acceptEntry(entryNumber) {
        return api.v1.admin.acceptEntry(entries[entryNumber].id)
    }
    function rejectEntry(entryNumber) {
        return api.v1.admin.rejectEntry(entries[entryNumber].id)
    }

    function commit(entryNumber, action) {
        action(entryNumber)
            .done(ok => {
                modals.clearAll()
                removeEntry(entryNumber);
            })
            .fail(xhr => window.alert(xhr.responseText))
    }
    
    function createCell(subfacet, alternating) {
        return el(`td${classification[subfacet.toUpperCase()] ? '.filled-cell' : ''}${alternating ? '.alternating-group' : ''}`)
    }

    function insertIntoTable(entry, position) {
        var classification = entry.serpClassification

        // let's build the table row for this entry
        var maxLength = 35;
        var entryTitle = entry["description"] || entry["reference"];
        entryTitle = entryTitle.length > maxLength ?
            entryTitle.substring(0, maxLength - 3) + "..." :
            entryTitle.substring(0, maxLength);

        var acceptBtn = el("button.entries-accept-btn", ["accept"]);
        acceptBtn.addEventListener("click", function(evt) {
            var entryNumber = this.parentNode.children[0].dataset.entryNumber
            commit(entryNumber, acceptEntry)
        }, false);

        var rejectBtn = el("button.entries-reject-btn", ["reject"]);
        rejectBtn.addEventListener("click", function(evt) {
            var entryNumber = this.parentNode.children[0].dataset.entryNumber
            commit(entryNumber, rejectEntry)
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

        document.getElementById("table-body").appendChild(row);

        $("td:first-child").on("click", function(evt) {
            var entryNumber = $(this).data("entry-number");
            var entry = entries[entryNumber];
            buildModalView(entry, entryNumber);
        });
    }

    // convenience function for capitalizing sentences
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    function buildModalView(entry, entryNumber) {
        var acceptBtn = el("button.btn", ["accept"]);
        acceptBtn.addEventListener("click", function(evt) {
            commit(entryNumber, acceptEntry)
        }, false);

        var rejectBtn = el("button.btn", ["reject"]);
        rejectBtn.addEventListener("click", function(evt) {
            commit(entryNumber, rejectEntry)
        }, false);

        var modalOpt = {
            button: [acceptBtn, rejectBtn]
        }

        modals.entryModal(entry, entry.serpClassification, modalOpt)
    }

    function removeEntry(entryNumber) {
        var num = Number(entryNumber)
        
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
