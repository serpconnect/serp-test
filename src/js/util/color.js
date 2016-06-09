(function (scope){
	// bright colors = low usage, dark colors = high usage
	// low usage (bright color) ---> high usage (dark color)
	// http://colorbrewer2.org/ -- 6 classes, sequential, single-hue
	var colors = {
		'effect': ['#c6dbef', '#9ecae1', '#6baed6', '#3182bd'],
		'scope': ['#c7e9c0', '#a1d99b', '#74c476', '#31a354'],
		'context': ['#fdae6b', '#fd8d3c', '#e6550d', '#a63603'],
		'intervention': ['#756bb1'],
		'serp': ['#FDFDFD']
	}

	/* HX color codes */
	function color_scheme () {
		/* return function that selects color based on percentage, i.e usage */
		var make_table = function () {
			var colors = Array.from(arguments)
			var threshold = 1.0 / colors.length
			return function (p) {
				p = Math.min(p, 1)
				/* guard against p=1.0 case where p / threshold = colors.length */
				return colors[Math.min(Math.floor(p / threshold), colors.length - 1)]
			}
		}

		var generate_facet = function (f) {
			scheme.push(make_table.apply(null, colors[f]))
			return scheme.length - 1
		}

		var scheme = []

		/* map facet to color table function */
		var map = {}
		SERP.forEach((f, c) => {
			if (map[f] >= 0)
				map[c] = map[f]
			else
				map[c] = map[f] = generate_facet(f)
		})

		map.serp = generate_facet('serp')

		var color = function (facet) {
			if (map.hasOwnProperty(facet))
				return scheme[map[facet]]

			throw "No such facet: '" + facet + "'"
		}

		return color
	}
	scope.colorScheme = color_scheme
})((window.util = window.util || {}))