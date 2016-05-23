var run = require('./index.js')

var t = Date.now()
process.on('exit', () => {
	console.log('Running all tests took', Date.now() - t, 'ms')
})

run('graph-parse.unit.js')
run('serp.unit.js')