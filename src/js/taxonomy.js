"use strict";
(function (win) {

    /* Data structure of the tree */
    function Node(short, long, children) {
        this.short = short
        this.long = long
        this.tree = children
    }
    Node.prototype.name = function() { return this.long }
    Node.prototype.id = function() { return this.short }
    /**
     * We have two types of leaf nodes:
     *   - nodes that have no children
     *   - nodes that are entities
     * Depending on what we do with the tree we want to interpret leaves
     * differently, e.g. tree shaking stops if it finds an entity leaf.
     */
    Node.prototype.isTreeLeaf = function () { return this.tree.length === 0 }
    Node.prototype.isEntityLeaf = function() { return this.id() === "leaf" }
    Node.prototype.isRoot = function() { return this.id() === "root" }
    Node.prototype.addChild = function(c) { this.tree.push(c) }
    Node.prototype.clone = function(deep) {
        var newNode = new Node(this.id(), this.name(), [])
        
        for (var i = 0; deep & i < this.tree.length; i++) {
            newNode.addChild(this.tree[i].clone(deep))
        }

        return newNode
    }

    /**
     * map is a bit special since it only maps children.
     * rationale is that you have the root object anyway
     * and it's easier this way to decide if you want it
     * in the new structure, or not.
     */
    Node.prototype.map = function(fn) { return this.tree.map(fn) }
    Node.prototype.mapP = function(fn) { return this.tree.map((child, i) => fn(this, child, i))}
    /**
     * Recursively remove nodes without any entity leaves.
     */
    Node.prototype.shake = function () {
        if (this.isEntityLeaf())
            return true

        for (var i = 0; i < this.tree.length; i++) {
            var keep = this.tree[i].shake()
            if (keep) continue
            this.tree.splice(i, 1)
            i--
        }

        if (this.isTreeLeaf())
            return undefined
        
        return this
    }

    /**
     * Depth-first search for node with id.
     */
    Node.prototype.dfs = function(id) {
        if (this.id().toLowerCase() === id.toLowerCase())
            return this
        
        for (var i = 0; i < this.tree.length; i++) {
            var probe = this.tree[i].dfs(id)
            if (probe)
                return probe
        }

        return undefined
    }

    /**
     * Breadth-first search for parent of node with id.
     */
    Node.prototype.parentOf = function (id) {
        var bfs = [this]
        
        id = id.toLowerCase()
        while (bfs.length > 0) {
            var node = bfs.shift()
            for (var j = 0; j < node.tree.length; j++)
                if (node.tree[j].id().toLowerCase() === id)
                    return node
                else
                    bfs.push(node.tree[j])
        }

        return undefined
    }

    /**
     * A tree representation of a taxonomy.
     */
    function Taxonomy(backend_repr) {   
        this.child2parent = {}
        this.short2long = {}

        this.root = new Node("root", "root", [])
        if (backend_repr)
            this.extend(backend_repr)   
    }

    /**
     * Update the root or get a copy of the tree.
     */
    Taxonomy.prototype.tree = function (new_root) {
        if (new_root)
            this.root = new_root
        else
            return this.root.clone(true)
    }


    /**
     * Extend a taxonomy.
     */
    Taxonomy.prototype.extend = function (flattened) {
        var flat = JSON.parse(JSON.stringify(flattened))
        while (flat.length) {
            var node = flat.shift()
            var parent = this.root.dfs(node.parent)
            
            if (!parent) {
                flat.push(node)
                continue
            }

            parent.addChild(new FacetNode(node.id, node.name, []))
        }
    }

    /**
     * Inserts a classification into a new tree. 
     */
    Taxonomy.prototype.classify = function (classification) {
        var copy = this.tree()
        var list = Object.keys(classification)
        for (var i = 0; i < list.length; i++) {
            var key = list[i]
            var values = classification[key]
            var node = copy.dfs(key.toLowerCase())
            
            if (!node) continue
            for (var j = 0; j < values.length; j++) {
                var entity = values[j]
                node.addChild(new Node("leaf", entity, []))
            }
        }
        return copy
    }

    win.Taxonomy = Taxonomy
    win.FacetNode = Node
})(window);