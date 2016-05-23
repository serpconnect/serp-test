var reporter = function (name, whenDone) {
	this.registered = 0
	this.cases = 0
	this.allOk = true
	this.done = () => {
		whenDone(name, this.allOk)
	}
}

reporter.prototype.register = function () {
	this.registered += 1
}

reporter.prototype.finish = function (ok) {
	if (!ok) this.allOk = false
	this.cases += 1

	if (this.cases === this.registered)
		this.done(this.allOk)
}


module.exports = reporter