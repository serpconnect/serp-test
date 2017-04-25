$(document).ready(function() {
    $("#login").text("profile");
    $("#login").addClass("current-view");

    var levelDescriptions = {
        'registered': "A registered user is an account that has clicked signup " +
                    "but hasn't clicked the confirmation link in the email. " +
                    "Such an account cannot be trusted since they could have " +
                    "entered anyone's email address. They _cannot_ submit new " +
                    "entries, only create new collections.",
        'user': "A user is simply an account that has confirmed " +
                "the signup email, proving that they have ownership" +
                " of it. Submitted entries must be approved by an " +
                "admin before they appear in the system.",
        'verified': "A verified user may submit entries to the system " +
                    "without going through the approval process.",
        'admin': "An admin can freely promote/demote all accounts" +
                ", accept/reject pending entries, remove and edit " +
                "existing entries. Make sure this" +
                " account is trusted before proceeding."
    }

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

    var emails = [];
    var emailMappings = {};

    var emailsFuzzy = undefined;
    var previousValue = undefined;

    function createLevelOption(level) {
        return el('option', {
            'value': level,
            'title': levelDescriptions[level]
        }, [level])
    }

    function recordPreviousValue(evt) {
        previousValue = this.value
    }
    function changeUserLevel(evt) {
        if (previousValue === this.value) return
        buildModalView($(this), this.dataset.email, previousValue, this.value);
    }

    window.api.ajax("GET", window.api.host + "/v1/admin/users").done(users => {
        var parent = document.querySelector('.users-area')

        users.forEach(user => {
            var select = el('select.users-select', {
                    'data-email': user.email,
                },
                Object.keys(levelDescriptions).map(createLevelOption)
            )
            select.value = user.trust.toLowerCase()

            select.addEventListener('focus', recordPreviousValue, false)
            select.addEventListener('change', changeUserLevel, false)
            
            var div = el('div.users-container', [
                el('div.users-email', [user.email]),
                select
            ])

            parent.appendChild(div)

            emails.push(user.email)
            emailMappings[emails.length - 1] = div
        })

        emailsFuzzy = new Fuse(emails, {
            threshold: 0.5
        });
    }).fail(xhr => {
        if (xhr.status === 403)
            window.location = "profile.html"
        else
            window.location = "login.html"
    })


    $("#users-search").on("input", function(evt) {
        var searchString = this.value;
        if (searchString) {
            $(".users-container").hide();
            var results = emailsFuzzy.search(searchString);
            if (results.length) {
                for (var i = 0; i < results.length; ++i) {
                    var matchingEmail = results[i];
                    $(emailMappings[matchingEmail]).show();
                }
            }
        } else {
            $(".users-container").show();
        }
    });

    function setDropdownSilent($dropdown, value) {
        var pv = previousValue
        previousValue = value
        $dropdown.val(value)
        previousValue = pv
    }

    function buildModalView($dropdown, userEmail, oldLevel, newLevel) {
        var modal = modals.optionsModal({
            desc: userEmail + " from " + oldLevel + " to " + newLevel,
            message: levelDescriptions[newLevel],
            input: [],
            btnText: 'accept'
        }, function accept() {
            window.api.ajax("PUT", window.api.host + "/v1/admin/set-trust", {
                email: userEmail,
                trust: newLevel.charAt(0).toUpperCase() + newLevel.substring(1)
            }).fail(reason => {
                window.alert(reason)
                setDropdownSilent($dropdown, oldLevel)
            })
        }, function cancel() {
            setDropdownSilent($dropdown, oldLevel)
        })
    }
});