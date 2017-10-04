all: install build
.PHONY: install, build, dev, clean, test, serve

install:
	npm install

release: clean
	BUILD_MODE=prod node ./scripts/build.js
	tar -czf frontend.tgz ./bin

build:
	node ./scripts/build.js

test:
	node test/all.js

dev: clean
	NODE_ENV=development node app.js

live: clean
	NODE_ENV=production node app.js

clean:
	rm -rf ./bin/
