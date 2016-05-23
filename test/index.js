var path = require('path')

// Do a quick test to check if a web server is running.
// jsdom require a web server to get pages from.
var client = require('net').connect({port: 9999})
client.on('connect', () => client.end())
client.on('error', () => {
	console.log("Couldn't connect to localhost:9999")
	console.log("Please start a web server in bin/")
	process.exit(1)
})

function runTest (file) {
	// allow both graph-parse.unit.js and graph-parse
	if (path.extname(file) !== '.js')
		file = file + '.unit.js'

	var t = Date.now()
	var tests = require(path.join(__dirname, file))
	tests((name, allok) => {
		console.log(`${name} (${Date.now() - t} ms): ${allok ? '\033[32mall ok\033[0m' : 'errored'}`)
	})
}

// support single-test runs (node test <file-name>)
if (process.argv.length > 2 && path.basename(__filename) === 'index.js') {
	runTest(process.argv[2])
}

module.exports = runTest