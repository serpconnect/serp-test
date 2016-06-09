var run = require('./index.js')

var t = Date.now()
process.on('exit', () => {
	console.log('Running all tests took', Date.now() - t, 'ms')
})

run('serp.unit.js')
