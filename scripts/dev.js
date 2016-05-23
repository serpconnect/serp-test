const fs = require('fs')
const path = require('path')

const lessc = require('./lessc.js')
const jadec = require('./jadec.js')
const jscpy = require('./jscpy.js')

const watchConf = {
	recursive: true,
	persistent: true
}

console.log('Watching views/, less/ and js/ folders for changes.')
console.log('Type Ctrl-C to stop. Happy coding!')

function filter (ext, callb) {
	return (evt, fname) => {
		if (path.extname(fname) === ext)
			callb(evt, fname)
	}
}

/* call fn (maximum) once every X millisec */
function throttle (fn) {
	var id = 0
	var args = []
	return (evt, file) => {
		// Many files can be changed during the consolidation window
		var uniq = args.indexOf(file) === -1
		if (uniq)
			args.push(file)

		// only allow one timer, i.e collapse many events into one
		if (id) return

		id = setTimeout(() => {
			args.forEach(file => fn(file))
			args = []
			id = 0
		}, 350)
	}
}

function watch_dir (dir, fn) {
	fs.watch(path.normalize(dir), watchConf, fn)
}

watch_dir('./src/views/', filter('.jade', throttle(jadec)))
watch_dir('./src/less/', filter('.less', throttle(lessc)))
watch_dir('./src/js/', filter('.js', throttle(jscpy)))
