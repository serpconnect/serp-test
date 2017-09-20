(function (G) {

	G.leaveCollectionModal = function (collectionId, isOwner) {
		return new Promise(function (F, R) {
			var title = `#${collectionId}`
			var message = isOwner? `Delete ${title}?`  : `Leave ${title}?`
			window.modals.confirmPopUp(message, () => {
				window.api.v1.collection.leave(collectionId)
					.then(F)
					.fail(xhr => window.alert(xhr.responseText))
			})
		})
	}

})(window.components || (window.components = {}));