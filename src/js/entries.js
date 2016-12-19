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
                insertIntoTable(entry, entries.length - 1)
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
    
    function createCell(taxonomy, subfacet, alternating) {
        var filled = taxonomy[subfacet.toUpperCase()] ? '.filled-cell' : ''
        var alt = alternating ? '.alternating-group' : ''
        return el(`td${filled}${alt}`)
    }

    function acceptEntryCallback(evt) {
        commit(Number(this.dataset.entryNumber), acceptEntry)
    }

    function rejectEntryCallback(evt) {
        commit(Number(this.dataset.entryNumber), rejectEntry)
    }

    function entryButton(name, style, entryNumber, fn) {
        var btn = el(`button.${style}`, {
            'data-entry-number': entryNumber
        }, [name]);
        btn.addEventListener("click", fn, false);
        return btn;
    }

    var maxLength = 35;
    function insertIntoTable(entry, entryNumber) {
        var entryTitle = entry["description"] || entry["reference"];
        if (entryTitle.length > maxLength)
            entryTitle = entryTitle.substring(0, maxLength - 3) + "..." 

        var title = el('td', [entryTitle])
        title.addEventListener('click', buildModalView, false)

        // let's build the table row for this entry
        var row = el('tr', {'data-entry-number': entryNumber }, [
            title,

            createCell(entry.serpClassification, "intervention", true),

            // effect
            createCell(entry.serpClassification, "solving"),
            createCell(entry.serpClassification, "adapting"),
            createCell(entry.serpClassification, "assessing"),
            createCell(entry.serpClassification, "improving"),

            // scope
            createCell(entry.serpClassification, "planning", true),
            createCell(entry.serpClassification, "design", true),
            createCell(entry.serpClassification, "execution", true),
            createCell(entry.serpClassification, "analysis", true),

            // context
            createCell(entry.serpClassification, "people"),
            createCell(entry.serpClassification, "information"),
            createCell(entry.serpClassification, "sut"),
            createCell(entry.serpClassification, "other"),

            el('td', [entryButton('accept', 'entries-accept-btn', entryNumber, acceptEntryCallback)]),
            el('td', [entryButton('reject', 'entries-reject-btn', entryNumber, rejectEntryCallback)])
        ])

        document.getElementById("table-body").appendChild(row);
    }

    function buildModalView(evt) {
        var entryNumber = Number(this.parentNode.dataset.entryNumber);
        var entry = entries[entryNumber];

        var modalOpt = {
            button: [
                entryButton('accept', 'btn', entryNumber, acceptEntryCallback),
                entryButton('reject', 'btn', entryNumber, rejectEntryCallback)
            ]
        }

        modals.entryModal(entry, entry.serpClassification, modalOpt)
    }

    function removeEntry(entryNumber) {
        var table = document.getElementById("table-body")

        // update data attribute of the table cells after the removed entry
        for (var i = entryNumber + 1; i < table.children.length; i++) {
            var row = table.children[i]
            var num = Number(row.dataset.entryNumber) - 1

            row.dataset.entryNumber = num

            var btns = row.querySelectorAll('button')
            for (var j = 0; j < btns.length; j++)
                btns[i].dataset.entryNumber = num
        }

        // remove the entry from the table, entryNumber+1 since nth-child starts from 1
        var row = table.children[entryNumber]
        row.parentNode.removeChild(row)

        // remove from our internal array
        entries.splice(entryNumber, 1);        
    }

});
