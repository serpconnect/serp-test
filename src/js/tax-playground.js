window.addEventListener('load', start)

var taxFunc = window.taxFunc = {}

var dynamic_Taxonomies = []

$(".entry-title").unbind("click").on("click", function(evt) {
            var entryNumber = $(this).data("entry-number");
            var id= dataset[entryNumber].id

            window.user.getEntry(id).done(entry => {
                window.user.getTaxonomyEntry(id).done(taxonomy => {
                    window.modals.entryModal(entry, taxonomy),function () {
                        }
                })
                .fail(reason => window.alert(reason))
            }).fail(reason => window.alert(reason))
})

function start() {
    document.getElementById('collect').addEventListener('change', select_collection, false)
    document.getElementById('entry').addEventListener('change', select_entry, false)
    document.getElementById('modal').addEventListener('click', select_option, false)
    document.getElementById('generate').addEventListener('click', generate, false)
    document.getElementById('inspect').addEventListener('click', inspect, false)
    window.TARGET = document.getElementById('taxonomy')
    load_collections()
}

function select_collection(evt) {
    load_entries(+this.value)
}

function select_entry(evt) {
    inspect_entry(+this.value)
}

function select_option(evt) {
    col =  document.getElementById('collect').value
    var x = isDynamic(col)
    backend_repr = generate_Taxonomy(dynamic_Taxonomies[x])
    generate_submit_classification(col)
    console.log(backend_repr)
    // var taxonomy = new Taxonomy(backend_repr)
    //make modal
    // col =  document.getElementById('collection').value
    // generate_Taxonomy(dynamic_Taxonomies[col])
    // var taxonomy = new Taxonomy(dynamic_Taxonomies[col])
    // console.log(taxonomy)
}

function clear_target() {
    while (TARGET.lastChild)
        TARGET.removeChild(TARGET.lastChild)
}

function generate() {
    x = document.getElementById('collection').value
    generate_submit_classification(x)
}

function inspect() {
    clear_target()
    entry_id = document.getElementById('entry').value
    load_taxonomy(entry_id).then(dump_taxonomy)
}

function inspect_entry(entry_id) {
    clear_target()
    console.log(entry_id)
    load_taxonomy(entry_id).then(inspect_classification)
}

function inspect_taxonomy(entry_id) {
    clear_target()
    dump_taxonomy(window.tx.treeMap({}))
}

taxFunc.byNbrOfChildren = function(a, b) {
    return a.children.length - b.children.length
}

/* Generate a classification setup a la submit page */
function classification_remove_row(evt) {
    var sample = this.parentNode
    sample.parentNode.removeChild(sample)
}
function classification_append_row(evt) {
    newLeaf = this.parentNode.children.input.value
    this.parentNode.parentNode.appendChild(
            el("div.leaf", [
                    el("div.header", [
                        el("label", [newLeaf]),
                        taxFunc.generate_checkbox()
                    ])
                ])
        )
    var sample = this.parentNode
    sample.parentNode.removeChild(sample)

   // this.parentNode.removeChild(this.parentNode)
}

/* when user clicks the [+] of a facet */
function classification_add_row(evt) {
    var remove = el("div.remove", ["✖"])
    var confirm = el("div.remove", ['\u2714'])
    input = el("input#input")
    remove.addEventListener('click', classification_remove_row) 
    confirm.addEventListener('click', classification_append_row) 
    console.log(evt.parentNode, evt.nextSibling)
    evt.parentNode.appendChild(el('div.entity-sample', [
        input,
        remove,
         el("div.divider"),
        confirm
    ]))
}
/* when user changes the checkbox value of a facet */
 taxFunc.classification_checkbox_click = function(evt) {
    var header = this.parentNode
    console.log(this)
    if (!this.checked) {
        /* the [+] and inputs are siblings to the header */
        while (header.nextSibling)
            header.parentNode.removeChild(header.nextSibling)
    } else {
        // TODO: Load text from somewhere
        // var add = el("div.additional-data", ["click to add new leaf +"])
        // add.addEventListener('click', 
            classification_add_row(header) //, false)
        // header.parentNode.insertBefore(add, header.nextSibling)
    }
}
    taxFunc.generate_checkbox = function() {
    var box = el("input", {type:"checkbox"})
    box.addEventListener('change', taxFunc.classification_checkbox_click, false)
    return box
}

function generate_submit_classification(col) {
    clear_target()
    x = isDynamic(col) //returns -1 if false
    console.log(x)
    if(x!=-1){
        backend_repr = generate_Taxonomy(dynamic_Taxonomies[x])
        var taxonomy = new Taxonomy(backend_repr)
    }
    else{
        var taxonomy = new Taxonomy([])
    }

    /**
     * div.classification
     *     div.node
     *         span "Effect"
     *         div.leaf
     *             div.header
     *                 label "Solve new problem"
     *                 input "[x]"
     *             div.additional-data "click to add description +"
     *             div.entity-sample
     *                 input
     *                 div.remove "x"
     */
    var cxx = el('div.classification#classification', taxonomy.tree().map(
        function build(node, i) {
            if (node.isTreeLeaf()) {
                return el("div.leaf", [
                    el("div.header", [
                        el("label", [node.name()]),
                        generate_checkbox()
                    ])
                ])
            } else {
                return el("div.node", [
                    el("span", [node.name()]),
                    node.map(build).sort(byNbrOfChildren)
                ])
            }
        }).sort(byNbrOfChildren)
    )

    var divider = el("div.center", [
        el("div.classification-divider", [""]),
        el("div.divider-title", ["Customise Classification"]),
        el("div.classification-divider", [""])
    ])
    var saveBtn = el('button.btn', ['save'])
    saveBtn.addEventListener('click', save_taxonomy, false)
    TARGET.appendChild(el("div", [divider, cxx]))
    TARGET.appendChild(saveBtn)

}

function generate_Taxonomy(tax){
    var mapping = tax['mapping']
    list = flattendList(mapping)
    // reverseList = createReverseMap(mapping)
    // shortHandMap = createShortHandMap(mapping)
    return list
}

function flattendList(mapping){
    var flattendList = []
    var ShortHandMap ={}
    mapping.forEach(function(current){
        short = current["child"]
        long = current["child"]
        parent = current["parent"]
        x = new Node(short,long,parent)
        flattendList.push(x)
        ShortHandMap[current["child"]]=current["child"]
        if (!(current["parent"] in ShortHandMap)){
            ShortHandMap[current["parent"]]=current["parent"]
            short = current["parent"]
            long = current["parent"]
            parent = "root"
            y = new Node(short,long,parent)
            flattendList.push(y)
        }
    })
    return flattendList

    function Node(short,long,parent) {
            this.short = short
            this.long = long
            this.parent = parent
    }
}

function createReverseMap(mapping){
    ReverseMap ={}

    mapping.forEach(function(current){
        ReverseMap[current["child"]]=current["parent"]
    })
    return ReverseMap
}

function createShortHandMap(mapping){
    ShortHandMap = {}
    mapping.forEach(function(current){
        ShortHandMap[current["child"]]=current["child"]
        if (!(current["parent"] in ShortHandMap))
        ShortHandMap[current["parent"]]=current["parent"]
    })
    return ShortHandMap
}

/* misc */
function load_collections() {
    return api.v1.account.collections().then(function (collz) {
        var target = document.getElementById('collect')
        for (var i = 0; i < collz.length; i++) {
            var id = collz[i].id
            var name = collz[i].name
            target.appendChild(el('option', {value: id}, [`${name}/${id}`]))
        }
    })
}

function load_entries(coll_id) {
    document.getElementById('collect').value = coll_id
    return window.api.ajax("GET", window.api.host + "/v1/collection/" + coll_id + "/graph")
        .then(function (graph) {
            var target = document.getElementById('entry')
            while (target.lastChild)
                target.removeChild(target.lastChild)
            for (var i = 0; i < graph.nodes.length; i++) {
                target.appendChild(el('option', {value: graph.nodes[i].id}, [""+graph.nodes[i].id]))
            }
        })
}

function load_taxonomy(entry_id) {
    console.log(entry_id)
    document.getElementById('entry').value = entry_id
    return api.v1.entry.taxonomy(entry_id).then(function (classification) {
        var taxonomy = new Taxonomy({})
        return taxonomy.classify(classification)
    })
}

function inspect_classification(root) {
    dump_taxonomy(root.shake())
}

function save_taxonomy(){
    col = document.getElementById('collect').value
    entry_id = document.getElementById('entry').value
    // dynamic = isDynamic(col)
    // if(dynamic!=-1){
    //     edit = edit(dynamic)
    //     if(edit==false)
    //         return    
    // }

    // edit=false
    // if(isDynamic(col)[0] ==true){
    //     if(confirm("this classification is already dynamic, are you sure you want to update it??")==true)
    //         edit=true
    //         isDynamic(col)[1]
    // }
    
        dynamic_classification = []
        $("div[class=node]").each(function() {
            findLeaves(this)
        });

        function findLeaves(current){
            if(isLeaf(current)){
               $(current).children( ".leaf" ).each(function() {
                    var parent = current.children[0].textContent
                    var child = $(this).children(".header")[0].children[0].textContent
                    var leaf = new Node(parent, child)
                    dynamic_classification.push(leaf);
                    findLeaves(this)
               })
            }

            else{
                return
            }
        }

        function Node(parent, child) {
            this.child = child
            this.parent = parent
        }

        function Collection(col, mapping) {
            this.id = col
            this.mapping = mapping
        }

        function isLeaf(leaf) {
           return $(leaf).children( ".leaf" ).length!=0
        }
        var collection = new Collection(col, dynamic_classification)
        dynamic_Taxonomies.push(collection)

        console.log(dynamic_Taxonomies)
}

    function isDynamic(col){
        dynamic=false
        index=0
        dynamic_Taxonomies.forEach(function(current){
            if(current["id"]==col){
                dynamic=true
                return
               }
            index++    
            })
        if(dynamic==true){
            return index
        }   
        else{
            return -1
        }
    }
    function edit(index){
        if(confirm("this classification is already dynamic, are you sure you want to update it??")==true){
            dynamic_Taxonomies.splice(index,(index+1))
            return true
        }
        else{
            return -1
        }
    }

function dump_taxonomy(root) {
    var target = document.getElementById('taxonomy')

    function explore(node, depth) {
        if (node.isEntityLeaf())
            return el("div.entity", [node.name()])

        var children = node.map((n, i) => explore(n, depth + 1))
        if (depth > 2)
            return children
        
        return el("div.sublevel.level-" + depth, [
            node.name(),
            children
        ])
    }

    var html = el("div.root", [
        root.map((n, i) => explore(n, 0))
    ])

    target.appendChild(html)
}