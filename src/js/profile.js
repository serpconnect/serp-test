$(function() {
    // Load logged in user and proceed to setup otherwise redirect to login
    window.user.self().done(setup).fail(toLogin)

    // Switch all buttons between disabled and enabled state
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

    // Easy { 'ok?', 'cancel' } type of poput
    function confirmModal(title, desc, btnText, callb) {
        var confirm = el('button.btn', [btnText])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", [title]),
            el("div.modal-divider"),
            el("div.modal-sub-item", [desc]),
            el("div.modal-divider"),
            confirm, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        confirm.addEventListener('click', (evt) => {
            toggleButtonState()
            callb()
        })

        document.body.appendChild(modal)
    }

    // We are on profile page (#login is a sham)
    $("#login").addClass("current-view")

    // Logout user when logout button was clicked
    $("#logout").click(evt => window.user.logout().done(toLogin))

    // Let user confirm account deletion before commencing orbital strike
    $("#delete").click(evt => {
        confirmModal("delete account",
            "This will delete your accont, but your collections and entries will remain. Are you sure?",
            "delete",
            () => {
                window.user.delete().done(toLogin)
            })
    })

    // Create a new collection
    $("#create").click(evt => {
        var create = el('button.btn', ['create'])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", ["create new collection"]),
            el("div.modal-divider"),
            el('input#name.submit-input-box', {
                placeholder: 'collection name',
                type: 'text',
                name: 'name'
            }),
            el("div.modal-divider"),
            create, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        create.addEventListener('click', (evt) => {
            toggleButtonState()

            window.api.ajax("POST", window.api.host + "/v1/collection/", {
                name: $('#name').val(),
            })
                .done(ok => {
                    document.body.removeChild(modal)
                    window.user.self().done(update)
                })
                .fail(xhr => {
                    $('.complaint').remove()
                    var old = document.getElementById('name')
                    old.parentNode.insertBefore(el('div.complaint', [
                        xhr.responseText
                    ]), old.nextSibling)
                    toggleButtonState()
                })
        }, false)

        document.body.appendChild(modal)
        modal.querySelector('input').focus()
    })

    // Change password dialog, must submit current and new passwords to api
    $("#change").click(evt => {
        var save = el('button.btn', ['save'])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", ["change password"]),
            el("div.modal-divider"),
            el('input#old.submit-input-box', {
                placeholder: 'old',
                type: 'password',
                name: 'old',
            }),
            el('input#new.submit-input-box', {
                placeholder: 'new',
                type: 'password',
                name: 'new'
            }),
            el("div.modal-divider"),
            save, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        save.addEventListener('click', (evt) => {
            toggleButtonState()

            window.api.ajax("POST", window.api.host + "/v1/account/change-password", {
                old: $('#old').val(),
                new: $('#new').val()
            }).done(ok => document.body.removeChild(modal))
            .fail(xhr => {
                $('.complaint').remove()
                var old = document.getElementById('old')
                old.parentNode.insertBefore(el('div.complaint', [xhr.responseText]), old.nextSibling)
                toggleButtonState()
            })
        }, false)

        document.body.appendChild(modal)
        modal.querySelector('input').focus()
    })

    document.addEventListener('keydown', function (evt) {
        if (evt.keyCode === 27) {
            var modal = document.querySelector('.modal')
            if (!modal) return
            document.body.removeChild(modal)
        }
    })

    window.addEventListener('load', () => {
        document.body.addEventListener('click', function (evt) {
            if (evt.target.className === "modal")
                document.body.removeChild(evt.target)
        }, false)
    })

    function toLogin() {
    	window.location = "login.html"
    }

    function invite(evt) {
        var parent = this.parentNode.parentNode.parentNode
        var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent

        var send = el('button.btn', ['send'])
        var cancel = el('button.btn', ['cancel'])
        var modal = el('div.modal', [el('div', [
            el("div.modal-entry-type", [String(name)]),
            el("div.modal-header-title", ["send invite"]),
            el("div.modal-divider"),
            el('input#email.submit-input-box', {
                placeholder : 'user email',
                type : 'email',
                name : 'email'
            }),
            el("div.modal-divider"),
            send, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        send.addEventListener('click', (evt) => {
            toggleButtonState()

            window.api.ajax("POST", window.api.host + "/v1/collection/" + id + "/invite", {
                email: $('#email').val(),
            })
                .done(ok => {
                    document.body.removeChild(modal)
                    window.user.self().done(update)
                })
                .fail(xhr => {
                    $('.complaint').remove()
                    var div = document.getElementById('name')
                    div.parentNode.insertBefore(el('div.complaint', [
                        xhr.responseText
                    ]), div.nextSibling)
                    toggleButtonState()
                })
        }, false)

        document.body.appendChild(modal)
        modal.querySelector('input').focus()
    }

    function leave(evt) {
        var parent = this.parentNode.parentNode.parentNode
    	var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent

        confirmModal(name,
            "Leave collection and lose access to entries in it?",
            "leave",
            () => {
    	       window.api.ajax("POST", window.api.host + "/v1/collection/" + id + "/leave")
            })
    }

    function submit(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/submit.html?c=" + id
    }

    function search(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/search.html#" + id
    }

    function showMembers(evt) {
        var parent = this.parentNode.parentNode.parentNode
        var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent

        window.api.ajax("GET", window.api.host + "/v1/collection/" + id + "/members")
            .done(members => {
                var ok = el('button.btn', ["ok"])

                var modal = el('div.modal', [el('div', [
                    el("div.modal-entry-type", [String(name)]),
                    el("div.modal-header-title", ["members"]),
                    el("div.modal-divider"),
                    members.map(member => el("div.modal-sub-item", [member.email])),
                    el("div.modal-divider"),
                    ok
                ])])

                ok.addEventListener('click', (evt) => {
                    document.body.removeChild(modal)
                }, false)

                document.body.appendChild(modal)
            })
            .fail(reason => window.alert(JSON.stringify(reason)))
    }

    function appendCollection(coll) {
    	var addUser = el('div.collection-option', ['add user'])
        var addEntry = el('div.collection-option', ['add entry'])
    	var members = el('div.collection-option', ['members'])
    	var leaveCollection = el('div.collection-option', ['leave collection'])
    	var showCollection = el('div.collection-option', ['show collection'])

        addUser.addEventListener('click', invite, false)
    	members.addEventListener('click', showMembers, false)
    	addEntry.addEventListener('click', submit, false)
    	leaveCollection.addEventListener('click', leave, false)
    	showCollection.addEventListener('click', search, false)

    	var obj = el('div.collection-wrapper', [
			el('div.collection-info', [
    			el('div.collection-title', [coll.name]),
    			el('div.collection-stats', [`${coll.members} users, ${coll.entries} entries`])
    		]),
            el('div.collection-options', [
                el('div.collection-row', [
                    addUser,
                    members
                ]),
                el('div.collection-row', [
                    addEntry,
                    showCollection,
                    leaveCollection
                ])
            ])
		])
		obj.dataset.collectionId = coll.id

    	$(".profile-content").append(obj)
    }

    function update(self) {
        $(".user-email").text(self.email + " (" + self.trust + ")")
        $("div.collection-wrapper").remove()
        self.collections.forEach(coll => {
            window.api.ajax("GET", window.api.host + `/v1/collection/${coll.id}/stats`)
                .then(data => {
                    coll.members = data.members
                    coll.entries = data.entries
                    appendCollection(coll)
                })
        })
    }

    function setup(self) {
        update(self)
        if (self.trust === "Admin") {
            var a = el('a.view-area-tab.unactive-tab', {href : "/users.html"}, ['users'])
            var b = el('a.view-area-tab.unactive-tab', {href : "/entries.html"}, ['pending entries'])
            var div = document.querySelector('.profile-area-wrapper')
            div.insertBefore(a, div.lastChild)
            div.insertBefore(b, div.lastChild)
        }
    }

})
