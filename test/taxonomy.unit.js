const asserter = require('assert')
const tester = require('./tester.js')
const Reporter = require('./reporter.js')

function assert (actual, expected, msg) {
	try {
		asserter.deepEqual(actual, expected)
		return true
	} catch (e) {
		console.error(`serp.unit.js (${arguments.callee.caller.name}): ${msg}`)
		console.error('Expected', expected)
		console.error('Actual', actual)
		return false
	}
}

module.exports = function (callb) {
	var reporter = new Reporter('serp.unit', callb)

	const run_test = (callb) => {
		reporter.register()
		tester("http://localhost:9999/explore.html", (win) => {
			var ok = callb(win)
			reporter.finish(ok)
		})
	}

	run_test(identity)
	run_test(extend)
}

function identity (window) {
	var ok = assert(new window.Taxonomy().root.tree.length, 0, "should output an empty taxonomy when nothing is provided")
	window.close()
	return ok
}

function extend (window) {
	var extension1 = [
		{ "parent": "root", "id": "feta", "name": "feta is very good" },
		{ "parent": "feta", "id": "greek", "name": "greek feta" }
	]

	var extension2 = [
		{ "parent": "root", "id": "mozzarella", "name": "not feta ost" }
	]

	var taxonomy = new window.Taxonomy()
	taxonomy.extend(extension1)
	taxonomy.extend(extension2)

	var ok = assert(taxonomy.root.tree.length, 2, "should add extensions as tree children")
	window.close()
	return ok
}

