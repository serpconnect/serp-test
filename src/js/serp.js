/* SERP taxonomy */
(function (scope) {
	var init_prop = function (obj, src, prop, val) {
		/* use provided value if present. Must compare with undefined
		 * to catch sneaky false values: 0, "", false
		 */
		obj[prop] = ((src && src[prop]) === undefined) ? val : src[prop]

		/* check-and-copy new stuff on key-basis */
		if (val) {
			for (var k in val) {
				var sub = obj[prop][k]
				/* don't count zero-length arrays as valid, but allow values
				 * that are implicitly false (0, "", false).
				 */
				var valid = (Array.isArray(sub) && sub.length > 0) ||
							(!Array.isArray(sub) && sub !== undefined)
				obj[prop][k] = valid ? sub : val[k]
			}
		}
	}

	function clone(obj) {
		if (obj === undefined || typeof obj !== 'object')
			return obj

		var cc = obj.constructor()
		for (var k in obj)
			cc[k] = clone(obj[k])
		return cc
	}

	var taxonomy = {
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
			sut: undefined,
			other: undefined
		}
	}

	var SERP = function (src) {
		init_prop(this, src, 'intervention')

		/* Must use new objects here, otherwise there will be reference hell */
		init_prop(this, src, 'effect', clone(taxonomy.effect))
		init_prop(this, src, 'context', clone(taxonomy.context))
		init_prop(this, src, 'scope', clone(taxonomy.scope))
	}

	/* This is probably not the correct object to do comparation,
	 * since matching is done in the graph domain it makes sense
	 * to use edges and vertices instead of SERP trees.
	 * TODO: On a good day, figure out how to translate this into
	 * a graph problem and refactor it somewhere where it belongs.
	 */

	/* Compare this serp classification to another, based on a facet.
	 * Returns an object with {equal, result, nonNull} keys.
	 *  - equal means that the two are identical
	 *  - result indicates if target has more (>0) or less (<0) facets
	 *  - nonNull is false if all subfacets on this are undefined
	 */
	SERP.prototype.compareFacet = function(facet, comp) {
		var equal = 0
		var nullcheck = false
		var hasMatch = false

		process_facet(facet, (f, k) => {
			var a = this.get(f, k)
			var b = comp.get(f, k)

			/* this way we can figure out if it's equal, over or under */
			if (a) equal--
			if (b) equal++

			hasMatch = hasMatch || (a && b)

			/* it is nice to know if we equal'd b/c both were null */
			nullcheck = nullcheck || a
		})

		return {
			/* shorthand b/c it's bothersome to compare with 0 */
			equal: equal===0,
			result: equal,
			nonNull: nullcheck,
			matched: hasMatch
		}
	}

	/* A complete match: all effect target and scope facets are matched */
	SERP.prototype.isCompleteMatch = function(other) {
		var hasEffect = this.compareFacet('effect', other)
		var hasScope = this.compareFacet('scope', other)

		return (hasEffect.result >= 0) && hasEffect.nonNull && hasEffect.matched
			&& (hasScope.result >= 0) && hasScope.nonNull && hasScope.matched
	}

	/* An incomplete match: either effect target and scope facets are matched */
	SERP.prototype.isIncompleteMatch = function(other) {
		var hasEffect = this.compareFacet('effect', other)
		if (hasEffect.result >= 0 && hasEffect.nonNull && hasEffect.matched)
			return true

		var hasScope = this.compareFacet('scope', other)
		return hasScope.result >= 0 && hasScope.nonNull && hasScope.matched
	}

	/* Guarded get: returns this[f][k] if k, otherwise this[f] */
	SERP.prototype.get = function (f, k) {
		if (k)
			return this[f][k]
		return this[f]
	}

	/* Guarded set: this[f][k] = v if k, otherwise this[f] = v */
	SERP.prototype.set = function (f, k, v) {
		if (k)
			this[f][k] = v
		else
			this[f] = v
	}

	/* Calls fn on all true keys: fn(facet, subfacet, value) */
	SERP.prototype.forValid = function (fn) {
		process_taxonomy((f, k) => {
			if (this.get(f, k))
				fn(f, k, this.get(f, k))
		}, false)
	}

	/* Calls fn on all keys: fn(facet, subfacet, value) */
	SERP.prototype.forEach = function (fn) {
		process_taxonomy((f, k) => {
			fn(f, k, this.get(f, k))
		}, false)
	}

	/* Calls fn on all top-level keys: fn(f, v) */
	SERP.prototype.forTop = function(fn) {
		process_taxonomy((f) => fn(f, this.get(f)), true)
	}

	/* Brings second-level keys to top level. Keeps all top-level keys. */
	SERP.prototype.flatten = function () {
		process_taxonomy((f, k) => {
			if (k)
				this[k] = this[f][k]
		}, false)
		return this
	}

	/* Call fn for all keys: fn(facet, subfacet) */
	SERP.forEach = (fn) => process_taxonomy(fn, false)

	/* Call fn for top-level keys: fn(facet) */
	SERP.forTop = (fn) => process_taxonomy(fn, true)

	/* Call fn for all keys or top-level only if topOnly is set */
	function process_taxonomy (fn, topOnly) {
		for (var f in taxonomy) {
			var v = taxonomy[f]
			if (v && !topOnly)
				for (var k in v)
					fn(f, k)
			else
				fn(f, null)
		}
	}
	function process_facet(facet, fn) {
		for (var sub in taxonomy[facet])
			fn(facet, sub)
	}

	/* export */
	scope.SERP = SERP
})(window)
