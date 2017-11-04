(function (G) {

	//Simple modal, with a title, some text and a button to close 
	//the modal which can be assigned a function too
	G.noticeModal = function(title, desc, method) {
 	      var continueBtn = el('button#continue.btn', ['continue'])
 	      var modal = 
 	      			el('div.modal.notice', [
 	              	el('div', [
 	                el("div.modal-header-title", [title]),
 	                el("div#bottom-divider.modal-divider"),
 	                el("div", [desc]),
 	                continueBtn
 	            ])
 	          ])

		continueBtn.addEventListener('click', (evt) => {
			window.modals.toggleButtonState()
			method.apply({modal})
		}, false)

		window.modalsEvt.pardonEvents()
		document.body.appendChild(modal)
		window.modals.appear(modal)

	}

})(window.components || (window.components = {}));