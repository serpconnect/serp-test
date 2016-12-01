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
    
      var deleteAccountModal = {  
            desc: "Delete Account",
            message: "This will delete your account, but your collections and entries will remain. Are you sure?",
            //message above input boxes
            input: [],
            //[textbox names, types, placeholder] //else put '[]'
            //automatically takes input[0] as first paramater for method passed in.. etc
            btnText: "Delete"
            //text on button
        };

        // Let user confirm account deletion before commencing orbital strike
        $("#delete").click(evt => { 
            window.modals.optionsModal(deleteAccountModal,function () {
                //A secondary box pops up to imply importance of the decision
                var message= "Delete Account - Are You Sure"
                window.modals.confirmPopUp(message, function () {
                
                    window.user.delete()
                    .done(ok => {
                        toLogin()
                    })
                    .fail(xhr => {
                        $('.modal-complaint').remove()
                        var error = document.getElementById('cancel')
                        error.parentNode.insertBefore(el('div.modal-complaint', [
                        xhr.responseText ]), error.nextSibling)
                        this.modal.window.profile.toggleButtonState()
                    })
                })
            })
        })


    var newCollectionModal = {  
            desc: "create new collection",
            message: "",
            //message above input boxes
            input: [['input0','text','collection name']],
            //[textbox names, types, placeholder] //else put '[]'
            //automatically takes input[0] as first paramater for method passed in.. etc
            btnText: "Create"
            //text on button
        };
        // Create a new collection
        $("#create").click(evt => {
            window.modals.optionsModal(newCollectionModal,function (name) {
                window.user.createCollection(name)
                .done(ok => {
                    document.body.removeChild(this.modal)
                    window.user.self().done(update)
                })
                .fail(xhr => {
                    $('.modal-complaint').remove()
                    var error = document.getElementById('cancel')
                    error.parentNode.insertBefore(el('div.modal-complaint', [
                    xhr.responseText ]), error.nextSibling)
                    this.modal.toggleButtonState()
                })
            })
        })

    // Change password dialog, must submit current and new passwords to api
      var newPasswordModal = {  
            desc: "Change your password",
            message: "",
            //message above input boxes
            input: [['input0','password','old password'],['input1','password','new password']],
            //[textbox names, types, placeholder] //else put '[]'
            //automatically takes input[0] as first paramater for method passed in.. etc
            btnText: "Save"
            //text on button
        };

    $("#change").click(evt => {
            window.modals.optionsModal(newPasswordModal,function (oldpw, newpw) {
                //modal.js.typeOfModal(relativeObject, parameters for relevant method)
                window.user.changePassword(oldpw, newpw)
                // method called from user.js
                .done(ok => {
                    document.body.removeChild(this.modal)
                    window.user.self().done(update)
                })
                .fail(xhr => {
                    $('.modal-complaint').remove()
                    var error = document.getElementById('cancel')
                    error.parentNode.insertBefore(el('div.modal-complaint', [
                        xhr.responseText ]), error.nextSibling)
                    this.modal.toggleButtonState()
                })
            })
        })

    function toLogin() {
    	window.location = "/login.html"
    }

function invite(evt) {
        var parent = this.parentNode.parentNode.parentNode
        var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent


        var inviteUserModal = {  
        desc: "Invite User to " + name,
        message: "",
        input: [['input0','email','user email']],
        btnText: "Send"
        //text on button
    }   
         window.modals.optionsModal(inviteUserModal,function (email) {
                //modal.js.typeOfModal(relativeObject, parameters for relevant method)
                window.user.collectionInvite(email,id)
                .done(ok => {
                    document.body.removeChild(this.modal)
                    window.user.self().done(update)
                })
                .fail(xhr => {
                    $('.modal-complaint').remove()
                    var error = document.getElementById('cancel')
                    error.parentNode.insertBefore(el('div.modal-complaint', [
                    xhr.responseText ]), error.nextSibling)
                    this.modal.toggleButtonState()
                })
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

    function explore(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/explore.html#" + id
    }

    function manage(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/collection.html#" + id
    }

    function appendCollection(self, coll) {
    	var addUser = el('div.collection-option', ['add user'])
        var addEntry = el('div.collection-option', ['add entry'])
        var manageCollection = el('div.collection-option', ['manage'])
        var showCollection = el('div.collection-option', ['search'])
    	var exploreCollection = el('div.collection-option', ['explore'])

        addUser.addEventListener('click', invite, false)
        addEntry.addEventListener('click', submit, false)
    	manageCollection.addEventListener('click', manage, false)
        showCollection.addEventListener('click', search, false)
    	exploreCollection.addEventListener('click', explore, false)

    	var obj = el('div.collection-wrapper', [
			el('div.collection-info', [
    			el('div.collection-title', [coll.name]),
    			el('div.collection-stats', [
                    `${coll.members} user${coll.members === 1 ? '' : 's'}, ${coll.entries} entr${coll.entries === 1 ? 'y' : 'ies'}`
                ])
    		]),
            el('div.collection-options', [
                el('div.collection-row', [
                    showCollection,
                    exploreCollection,
                    manageCollection
                ]),
                el('div.collection-row', [
                    addUser,
                    addEntry
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
                    appendCollection(self, coll)
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
