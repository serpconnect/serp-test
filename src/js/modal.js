(function (CTX) {

	/**
	 * window.modal(el('div.modal-header-title', ['title']),
	 * 				constructEntry(e))
	 * 			.cancel('close')
	 * 			.show()
	 */

	var modal = function (header, body, footer) {
		this.div = el('div.modal', [el('div', [
			header, 
			el("div.modal-divider"),
			body, 
			el("div.modal-divider"),
			footer // might be undefined but won't be added in that case
		])])

		// The X in the top-right corner
		var closeBtn = el('div.close-btn', [''])
		this.div.firstChild.appendChild(closeBtn)
		closeBtn.addEventListener('click', destroy, false)
	}

    modal.prototype.toggleButtonState = function() {
        var btns = this.div.querySelectorAll('.btn')
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('submit-disabled')
            if (btns[i].getAttribute('disabled'))
                btns[i].removeAttribute('disabled')
            else
                btns[i].setAttribute('disabled', true)
        }
    }

	modal.prototype.confirm = function (name, cb) {
		var btn = el('button.btn', [name])

		this.div.firstChild.appendChild(btn)

		btn.addEventListener('click', cb, false)
		return this
	}

	modal.prototype.cancel = function (name, cb) {
		var btn = el('button.btn', [name])

		this.div.firstChild.appendChild(btn)

		if (cb)
			btn.addEventListener('click', cb, false)
		else
			btn.addEventListener('click', destroy, false)

		return this
	}

	modal.prototype.show = function () {
		document.body.appendChild(this.div)
		return this
	}

	function destroy() {
		document.body.removeChild(document.querySelector('div.modal'))
	}

	// Remove active modal when pressing ESC
    document.addEventListener('keydown', (evt) => {
    	if (evt.keyCode === 27) {
    		var modal = document.querySelector('.modal')
    		if (!modal) return
    		document.body.removeChild(modal)
    	}
    }, false)

	// Remove active modal when clicking outside modal
    window.addEventListener('load', () => {
	    document.body.addEventListener('click', (evt) => {
	    	if (evt.target.className === "modal")
	    		document.body.removeChild(evt.target)
	    })
	}, false)
	CTX.modal = modal	

})(window);
