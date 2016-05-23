$(document).ready(function() {
    $("#login").text("profile");
    $("#login").addClass("current-view");

    var emails = [];
    var emailMappings = {};

    var emailsFuzzy = undefined;
    var previousValue = undefined;

    window.api.ajax("GET", window.api.host + "/v1/admin/users").done(users => {
        var parent = $('.users-content')

        users.forEach(user => {
            var div = el('div').addClass('users-container')
            div.append(el('div').addClass('users-email').text(user.email))

            var select = el('select').addClass('users-select')
            select.data("email", user.email)
            select.append(el('option').attr('value', 'registered').text('registered'))
            select.append(el('option').attr('value', 'user').text('user'))
            select.append(el('option').attr('value', 'verified').text('verified'))
            select.append(el('option').attr('value', 'admin').text('admin'))
            select.val(user.trust.toLowerCase())
            div.append(select)

            div.append(el('label').addClass('collection-dropdown-label'))
            parent.append(div)

            emails.push(user.email)
            emailMappings[user.email] = div
        })

        // construct the fuzzy set from the emails
        emailsFuzzy = FuzzySet(emails);

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
            var results = emailsFuzzy.get(searchString, []);
            if (results.length) {
                for (var i = 0; i < results.length; ++i) {
                    var matchingEmail = results[i][1];
                    emailMappings[matchingEmail].show();
                }
            }
        } else {
            $(".users-email").parent().show();
        }
    });


    function buildModalView($dropdown, userEmail, oldLevel, newLevel) {
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

        var changeText = "from " + oldLevel + " to " + newLevel;

        $content.append(el("div").addClass("modal-entry-type").text("changing user level"));
        $content.append(el("div").addClass("modal-entry-title").text(userEmail));
        $content.append(el("div").addClass("modal-entry-title").text(changeText));
        $content.append(el("div").addClass("modal-divider"));

        var $cancelBtn = el("button").addClass("edit-btn").text("cancel");
        $cancelBtn.on("click", function(evt) {
            console.log("cancel this user change!!!!!!!!");
            $(".modal").remove();
            $dropdown.val(oldLevel);
        });
        $content.append($cancelBtn);

        var $acceptBtn = el("button").addClass("edit-btn").text("accept");
        $acceptBtn.on("click", function(evt) {
            window.api.ajax("PUT", window.api.host + "/v1/admin/set-trust", {
                email: userEmail,
                trust: newLevel.charAt(0).toUpperCase() + newLevel.substring(1)
            }).done(ok => {
                $(".modal").remove();
            }).fail(reason => window.alert(reason))
        });
        $content.append($acceptBtn);

        $modal.append($content);
        $("body").append($modal);
    }
});

// more efficient way of creating elements than purely using jquery;
// basically an alias for document.createElement - returns a jquery element
function el(elementType) {
    return $(document.createElement(elementType));
}
