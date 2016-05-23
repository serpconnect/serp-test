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
	run_test(forEach)
	run_test(forTop)
	run_test(flatten)
	run_test(initWithFalseValues)
}
var ref = {
	intervention: undefined,
	effect: {
		adapting: undefined,
		solving: undefined,
		assessing: undefined,
		improving: undefined
	},
	scope: {
		planning: undefined,
		design: undefined,
		execution: undefined,
		analysis: undefined
	},
	context: {
		people: undefined,
		information: undefined,
		sut: undefined
	}
}

function identity (win) {
	var ok = assert(new win.SERP(), ref, "should output a reference taxonomy when nothing is provided")
	win.close()
	return ok
}

function forEach (win) {
	var serp = new Set([
		'intervention',
		'effect', 'adapting', 'solving', 'assessing', 'improving',
		'scope', 'planning', 'design', 'execution', 'analysis',
		'context', 'people', 'information', 'sut'
	])
	var match = new Set()
	win.SERP.forEach((f, k) => {
		match.add(f)
		match.add(k)
	})
	var ok = assert(match, serp, "forEach should loop over all taxonomy keys")
	win.close()
	return ok
}


function forTop (win) {
	var serp = new Set([
		'intervention',
		'effect',
		'scope',
		'context'
	])
	var match = new Set()
	win.SERP.forTop((f, k) => {
		match.add(f)
	})
	var ok = assert(match, serp, "forTop should loop over top-level taxonomy keys")
	win.close()
	return ok
}

function flatten (win) {
	var serp = {
		intervention: undefined,
		effect: {
			adapting: undefined,
			solving: undefined,
			assessing: undefined,
			improving: undefined
		},
		adapting: undefined,
		solving: undefined,
		assessing: undefined,
		improving: undefined,
		scope: {
			planning: undefined,
			design: undefined,
			execution: undefined,
			analysis: undefined
		},
		planning: undefined,
		design: undefined,
		execution: undefined,
		analysis: undefined,
		context: {
			people: undefined,
			information: undefined,
			sut: undefined
		},
		people: undefined,
		information: undefined,
		sut: undefined
	}
	var match = new win.SERP().flatten()
	var ok = assert(match, serp,
		"flatten should upgrade second-level keys to top-level while keeping top-level")

	win.close()
	return ok
}

function initWithFalseValues(win) {
	var falseInit = Object.assign({}, ref)
	falseInit.intervention = 0

	var match = new win.SERP({ intervention: 0 })
	var ok = assert(match, falseInit, "should init allow new objects to have falsly values")
	win.close()
	return ok
}