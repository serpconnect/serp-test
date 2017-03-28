$(document).ready(function() {
    $("#login").addClass("current-view");

    function el(elementType) {
        return $(document.createElement(elementType));
    }

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    function clearComplaints() {
        $(".complaint").remove()
    }

    function complainSomeMore(where, what) {
        $(where).append(el("div").addClass("complaint").text(what));
    }

    window.api.ajax("GET", window.api.host + "/v1/account/login")
    .done(ok => window.location = "/profile.html")

    function resetPassword(email) {
        var req = window.user.resetPassword(email)

        req.done(xhr => {
            $(".login-input-area-wrapper").empty()
                .text("An email has been sent to the specified address with further instructions.")
        })

        req.fail(xhr => complainSomeMore($("#email-wrapper"), xhr.responseText))

    }

    function login(email, passw) {
        var req = window.user.login(email, passw)

        req.done(xhr => window.location = "profile.html")

        req.fail(xhr => {
            complainSomeMore("#email-wrapper", xhr.responseText)
            complainSomeMore("#password-wrapper", xhr.responseText)
            enableButtons()
            $("#password").val("")
        })
    }

    function register(email, passw) {
        var req = window.user.register(email, passw)

        req.done(xhr => window.location = "profile.html")

        req.fail(xhr => {
            enableButtons()
            complainSomeMore("#email-wrapper", xhr.responseText)
        })
    }

    function disableButtons() {
        $("#register-btn").prop("disabled", true).addClass("submit-disabled")
        $("#login-btn").prop("disabled", true).addClass("submit-disabled")
    }

    function enableButtons() {
        $("#register-btn").prop("disabled", false).removeClass("submit-disabled")
        $("#login-btn").prop("disabled", false).removeClass("submit-disabled")
    }

    //    
    //allows user to press Enter Key to login. Timeout is for functionality on chrome
    document.addEventListener('keydown', (evt) => {
        if (evt.keyCode !== 13)
            return
        setTimeout(function() {
            $("#login-btn").click()
        }, 50)
    }, false)

    $("#login-btn").on("click", function(evt) {
        var email = $("#email").val();
        
        disableButtons()
        clearComplaints()

        if ($(this).text() === "login") {
            login(email, $("#password").val())
        } else {
            resetPassword(email)
        }
    });

    $("#register-btn").on("click", function(evt) {
        var email = $("#email").val();

        disableButtons()
        clearComplaints()

        if (!validateEmail(email)) {
            enableButtons()
            complainSomeMore("#email-wrapper", "please supply a valid email address");
        } else {
            register(email, $("#password").val())
        }
    });

    $("#forgot-password").on("click", function(evt) {
        // hide password
        $("#password-wrapper").slideToggle();
        // change buttons
        $("#register-btn").slideToggle();
        if ($(this).text() === "I forgot my password.") {
            $(this).text("Just joking, I found it.");
            $("#login-btn").text("request");
        } else {
            $(this).text("I forgot my password.");
            $("#login-btn").text("login");
        }
    });
});
