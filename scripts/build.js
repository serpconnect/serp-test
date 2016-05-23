require('./lessc.js')()
require('./jadec.js')()
require('./jscpy.js')()
require('./imgcpy.js')()

require('./ioutil.js').copy('./src/favicon.ico', './bin/favicon.ico')
