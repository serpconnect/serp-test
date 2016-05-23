var path = require('path')
var jade = require('jade')
var ioutil = require('./ioutil.js')

var prodMode = process.env["BUILD_MODE"] === "prod"

/* don't render the layout template */
var exclude = ['base.jade']

/* render jade files in serpent/src/views --> serpent/bin
 *
 *	file:
 *		- undefined: process jade dir
 *		- relative path: only render that path/file
 */
function render(file, src, dst) {
	if (file.ext !== '.jade')
		return

	if (exclude.some(n => n === file.name))
		return

	/* xyz.jade --> xyz.html */
	dst = path.join(path.dirname(dst), path.basename(file.name, file.ext))
		+ '.html'

	ioutil.log('jadec', src, '-->', dst)
	var env = prodMode ? "prod" : "dev"

	ioutil.writeFile(dst, jade.renderFile(src, {
		filename: src,
		env: env
	}))
}

module.exports = ioutil.process('./src/views/', './bin/', render)
