$(document).ready(function() {
    $("#login").text("profile");
    $("#login").addClass("current-view");


    /* Add red text after the cancel button on a modal */
    function complain(text) {
        $('.modal-complaint').remove()
        modals.clearTop()
        var modal = document.querySelector(".modal") || document.querySelector(".confirm")
        var errors = modal.querySelectorAll('button')
        var error = errors[errors.length - 1]
        var complaint = el('div.modal-complaint', [text])
        error.parentNode.insertBefore(complaint, error.nextSibling)
    }

    user.invites().done(showInvites)
    //check if invites exist and display number above invitations tab on profile page
    function showInvites(invites) {
        if(invites.length > 0 ){
            var invitationsContainer = el('div',{className : 'invitationContainer'})
            var new_Invitations = el('a',{className:'newInvitation', href:"/invitations.html", text: invites.length + " " })
            invitationsContainer.appendChild(new_Invitations)
            $("[href='/invitations.html']").append(invitationsContainer)
         }
    }

    var emails = [];
    var emailMappings = {};

    var emailsFuzzy = undefined;
    var previousValue = undefined;


    window.api.ajax("GET", window.api.host + "/v1/admin/users").done(users => {
        var parent = $('.users-content')

        emailsFuzzy = new Fuse(users.map(user => user.email), {

        })

        users.forEach(user => {
            var div = el('div',{className : 'users-container'})
            div.appendChild(el('div',{className: 'users-email',text:user.email}))

            var select = el('select',{className : 'users-select'})
            select.dataset.email = user.email
            select.appendChild(el('option',{value:'registered',text:'registered'}))
            select.appendChild(el('option',{value:'user',text:'user'}))
            select.appendChild(el('option',{value:'verified',text:'verified'}))
            select.appendChild(el('option',{value:'admin',text:'admin'}))
            select.value = user.trust.toLowerCase();
            div.appendChild(select)

            var deleteUser = el("button",{className: 'normal-btn',value:'delete',text:'delete'})

            var deleteAccountModal = {
                desc: "Delete Account",
                message: "This will delete " + user.email + ", but the users collections and entries will remain. Are you sure?",
                input: [],
                btnText: "Delete"
            };
            deleteUser.addEventListener("click", evt =>{
              window.modals.optionsModal(deleteAccountModal, function () {
                      api.v1.admin.collectionsOwnedBy(user.email).done(colls => {
                          if(colls.length!=0){
                            msg = "Warning the user is owner of the following collections:\n"
                            var deleteOwnerModal = {
                                desc: "Delete Collection Owner",
                                message: "Warning the user is owner of the following collections:",
                                bottomMessage : "Deleting the user will nuke those collections, proceed?",
                                list: colls
                            }

                            window.modals.confirmDeleteOwnerPopUp(deleteOwnerModal, ()=> {
                                api.v1.admin.delete(user.email)
                                  .done(ok =>{
                                    modals.clearAll()
                                    location.reload(true)
                                  }).fail(xhr => complain(xhr.responseText))

                            })
                        }else{
                            api.v1.admin.delete(user.email)
                              .done(ok =>{
                                modals.clearAll()
                                location.reload(true)
                              }).fail(xhr => complain(xhr.responseText))
                        }
                    })
              })
            })

            div.appendChild(el('label',{className:'collection-dropdown-label'}))
            div.appendChild(deleteUser);
            parent.append(div)

            emails.push(user.email)
            emailMappings[emails.length - 1] = div
        })

        emailsFuzzy = new Fuse(emails, {
            threshold: 0.5
        });

        $(".users-select").on("focus", function() {
            previousValue = $(this).val();
        }).on("change", function(evt) {
            buildModalView($(this), $(this).data("email"), previousValue, $(this).val());
        });
    }).fail(xhr => {
        if (xhr.status === 403)
            window.location = "profile.html"
        else
            window.location = "login.html"
    })


    $("#users-search").on("input", function(evt) {
        var searchString = $(this).val();
        if (searchString) {
            $(".users-email").parent().hide();
            var results = emailsFuzzy.search(searchString);
            if (results.length) {
                for (var i = 0; i < results.length; ++i) {
                    var matchingEmail = results[i];
                    $(emailMappings[matchingEmail]).show();
                }
            }
        } else {
            $(".users-email").parent().show();
        }
    });


    function buildModalView($dropdown, userEmail, oldLevel, newLevel) {
      var changeAccountModal = {
          desc: "Changing user level",
          message: "This will change " + userEmail + " from " + oldLevel + " to " + newLevel,
          input: [],
          btnText: "Change"
      };

      $dropdown.val(oldLevel.toLowerCase())
      window.modals.optionsModal(changeAccountModal, ok => {

            window.api.ajax("PUT", window.api.host + "/v1/admin/set-trust", {
                email: userEmail,
                trust: newLevel.charAt(0).toUpperCase() + newLevel.substring(1)
            }).done(ok => {

            //    $(".modal").remove();
            }).fail(reason => window.alert(reason))
            .done(ok =>{
                $dropdown.val(newLevel.toLowerCase())
                modals.clearAll()
            }).fail(xhr => complain(xhr.responseText))
      })
    }
});
