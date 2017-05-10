$(function() {
    //stores friends emails of the logged in user
    var friends = [];
    var collections = [];
    var collectionsMappings = {};

    var collectionsFuzzy = undefined;

    user.invites().done(showInvites)
    //check if invites exist and display number above invitations tab on profile page
    function showInvites(invites) {
        if(invites.length > 0 ){
            var invitationsContainer = el('div.invitationContainer')
            var new_Invitations = el('a.newInvitation', {href : "/invitations.html"},invites.length + " " )
            invitationsContainer.appendChild(new_Invitations)
            document.querySelector("[href='/invitations.html']").appendChild(invitationsContainer)
         }
    }

    /* Add red text after the cancel button on a modal */
    function complain(text) {
        $('.modal-complaint').remove()
        modals.clearConfirm()
        var modal = document.querySelector(".modal") || document.querySelector(".confirm")
        var errors = modal.querySelectorAll('button')
        var error = errors[errors.length - 1]
        var complaint = el('div.modal-complaint', [text])
        error.parentNode.insertBefore(complaint, error.nextSibling)
    }

    function cleanup(modal) {
        modals.clearAll()
        api.v1.account.self().done(update)
    }

    function invite(evt) {
        var parent = this.parentNode.parentNode.parentNode
        var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent

        var inviteUserModal = {
            desc: "Invite User to " + name,
            message: "",
            input: [['input0','email','user email']],
            btnText: "Invite"
        }

        window.modals.optionsModal(inviteUserModal,function (email) {
            api.v1.collection.invite(email, id)
                .done(ok => cleanup(this.modal))
                .fail(xhr => complain(xhr.responseText))
        })

        new Awesomplete('#input0', {
                        list: friends,
                        filter: ausomplete.autocompleteFilter,
                        replace: ausomplete.autocompleteUpdate
                })
    }

    function kick(evt) {
        var parent = this.parentNode.parentNode.parentNode
        var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent

        var myemail = document.getElementsByClassName('user-email')[0].innerHTML
        var indx = myemail.indexOf(' ')
        myemail=myemail.substring(0,indx);
        api.v1.collection.members(id,"all").done(data =>  {
          var emails=[];
          for(i = 0; i<data.length;i++){
            if(data[i].email != myemail){
              emails[i]=data[i].email;
            }
          }


        var kickUserModal = {
            desc: "Kick User from " + name,
            message: "",
            list: emails,
            input: [['input0','email','user email']],
            btnText: "Kick"
        }

        //fix alternatives so only people in the collection shows up
        window.modals.fuzzyModal(kickUserModal,function (email) {
            window.modals.confirmKickPopUp(`Are you sure you want to Kick ${email}?`, () => {
                api.v1.collection.kick(email, id)
                    .done(ok => cleanup(this.modal))
                    .fail(xhr => complain(xhr.responseText))
            })

        })


          new Awesomplete('#input0', {
                          list: emails,
                          filter: ausomplete.autocompleteFilter,
                          replace: ausomplete.autocompleteUpdate
                  })
        })
    }

    function submit(evt) {
        var id = getId(this.parentNode)
        window.location = window.location.origin + "/submit.html?c=" + id
    }

    function search(evt) {
        var id = getId(this.parentNode)
        window.location = window.location.origin + "/search.html#" + id
    }

    function explore(evt) {
          var id = getId(this.parentNode)
        window.location = window.location.origin + "/explore.html#" + id
    }

    function manage(evt) {
        var id = getId(this.parentNode)
        window.location = window.location.origin + "/collection.html#" + id
    }

    function getId(parent){
      while(parent.className!='collection-wrapper'){
        parent=parent.parentNode;
      }
      return parent.dataset.collectionId
    }

    function deleteColl(evt){
      var id=getId(this.parentNode);
      var coll = "#" + id;
      window.modals.confirmKickPopUp(`Are you sure you want to delete ${coll}?`, () => {
        window.api.ajax("POST", window.api.host + "/v1/admin/delete-collection",{id:id})
          .done(ok => {
            cleanup(this.modal)
            location.reload(true)
          })
          .fail(xhr => complain(xhr.responseText))
        })
    }

    function collectionOption(name, callback) {
        var option = el('div.collection-option', [name])
        option.addEventListener('click', callback, false)
        return option
    }

    /* X member(s), Y entr(y|ies) */
    function formatStats(members, entries) {
        var mems = members === 1 ? "member" : "members"
        var entr = entries === 1 ? "entry" : "entries"

        return `${members} ${mems}, ${entries} ${entr}`
    }

    function appendCollection(self, coll, isOwner,mine) {
        var ownerActions = el('div.collection-row', [
             collectionOption('add user', invite),
             collectionOption('kick user', kick)
        ])
        var myActions = el('div.collection-row', [
            collectionOption('manage', manage),
            collectionOption('add entry', submit),
        ])

        var adminActions = el('div.collection-row', [
          collectionOption('delete', deleteColl),
        ])

    	var obj = el('div.collection-wrapper', [
			el('div.collection-info', [
    			el('a.collection-title', {href: "/collection.html#" + coll.id}, [
                    el('span', [coll.name]),
                    el('span.collection-id', [" #" + coll.id]),
                    el('span.collection-owner',[isOwner ? " (owner)" : ""])
                ]),
    			el('div.collection-stats', [formatStats(coll.members, coll.entries)])
    		]),
            el('div.collection-options', [
                el('div.collection-row', [
                    collectionOption('search', search),
                    collectionOption('explore', explore),
                ]),
                mine ? myActions : undefined,
                isOwner ? ownerActions : undefined,
                adminActions
            ])
		])

		  obj.dataset.collectionId = coll.id
      if(mine){
          document.querySelector("div.my-collections-container").appendChild(obj)
      }else{
        document.querySelector("div.all-collections-container").appendChild(obj)
      }
      collections.push(coll.name + " #" + coll.id)
      collectionsMappings[collections.length - 1] = obj

    }

    function update(self) {
        $(".user-email").text(`${self.email} (${self.trust})`)
        $("div.collection-wrapper").remove()
        document.querySelector(".collections-container").appendChild(el('div.my-collections-container'))
        self.collections.forEach(coll => {
            api.v1.collection.stats(coll.id).then(data => {
                coll.members = data.members
                coll.entries = data.entries
            }).then(function(){
                return api.v1.collection.isOwner(coll.id)
            }).then(owner => {
                appendCollection(self, coll, owner,true)
            })
        })

        api.v1.account.friends(self.email).done(data => friends = data)
    }

    $("#collections-search").on("input", function(evt) {
        var searchString = this.value;

        if (searchString) {
            //console.log($(".collection-wrapper"));
            $(".collection-wrapper").hide();
            var results = collectionsFuzzy.search(searchString);
            if (results.length) {
                for (var i = 0; i < results.length; ++i) {
                    var matchingCollection = results[i];
                    $(collectionsMappings[matchingCollection]).show();
                }
            }
        } else {
            $(".collection-wrapper").show();
        }
    });

    function setup(self) {
        if(self.trust != "Admin"){
          window.location = "/profile.html"
        }


        update(self)
        var div = document.querySelector('.profile-area-wrapper')
        var divall = document.querySelector('.collections-container')
        divall.appendChild(el('div.all-collections-container'))
        window.api.ajax("GET", window.api.host + "/v1/admin/collections").done(collections =>{
          collections.forEach(coll => {
              api.v1.collection.stats(coll.id).then(data => {
                  coll.members = data.members
                  coll.entries = data.entries
              }).then(function(){
                  return api.v1.admin.isOwner(coll.id)
              }).then(owner => {
                  appendCollection(self, coll, owner,false)
              })
          })
        })

        collectionsFuzzy = new Fuse(collections, {
            threshold: 0.5
        });


    }

    // Load logged in user and proceed to setup otherwise redirect to login
    api.v1.account.self()
        .done(setup)
        .fail(xhr => window.location = "/login.html")

    $("#profile").addClass("current-view");
})
