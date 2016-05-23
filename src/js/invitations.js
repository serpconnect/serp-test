$(document).ready(function() {
    $("#login").text("profile");
    $("#login").addClass("current-view");

    window.user.invites().done(showPending).fail(somethingWentWrong)

    window.api.ajax("GET", window.api.host + "/v1/admin").done(ok => {
        var a = el('a.view-area-tab.unactive-tab', {href : "/users.html"}, ['users'])
        var b = el('a.view-area-tab.unactive-tab', {href : "/entries.html"}, ['pending entries'])
        var div = document.querySelector('.profile-area-wrapper')
        div.insertBefore(a, div.lastChild)
        div.insertBefore(b, div.lastChild)
    })

    function somethingWentWrong(reason, xhr) {}

    function showPending(invites) {
        var parent = $(".invitation-content")

        invites.forEach(coll => {
            var acceptBtn = el("button.invitation-btn.accept-btn", ['accept'])
            var rejectBtn = el("button.invitation-btn.reject-btn", ['reject'])

            acceptBtn.addEventListener('click', accept, false)
            rejectBtn.addEventListener('click', reject, false)

            var div = el('div.invitation-wrapper', [
                el('div.invitation-text', [
                    'You were invited to',
                    el('div.invitation-link', [`${coll.name} (${coll.id})`])
                ]),
                acceptBtn,
                rejectBtn
            ])
            div.dataset.collectionId = coll.id
            parent.append(div)
        })
    }

    function commit(node, action) {
        var id = node.parentNode.dataset.collectionId
        var parent = $(node.parentNode)

        parent.children("button").attr("disabled", true)

        window.api.ajax("POST", window.api.host + "/v1/collection/" + id + action)
        .done(obj => parent.slideToggle()).fail(reason => window.alert(JSON.stringify(reason)))
    }

    function accept(evt) {
        commit(this, "/accept")
    }

    function reject(evt) {
        commit(this, "/reject")
    }
});
