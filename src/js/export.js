(function (){
  "use strict";

  window.export = {
    toFile:exportCollectionToFile
  }

  var cID;
  var cName;
  var modal;

  var delimiters = [
      {value: ',' , display: 'Comma (,)'},
      {value: ';' , display: 'Semi-Colon (;)'},
      {value: ':' , display: 'Colon (:)'},
      {value: '|' , display: 'Pipe (|)'},
      {value: '^' , display: 'Caret (^)'},
      {value: '~' , display: 'Tilde (~)'},
      {value: '\t' , display: 'Tab'},
      {value: ' ' , display: 'Space'}
  ];

  function exportCollectionToFile(collID, colName){
    cID = collID;
    cName = colName;
    createExportModal();

    // Comma should probably not be the default delimiter
    // since a lot of the entries contain commas.
    document.getElementById("selectDelimiterCSV").selectedIndex = 1;
    document.getElementById("selectDelimiterLeaf").selectedIndex = 3;

    document.getElementById("exportCloseBtn").addEventListener('click', destroy, false);
    document.getElementById("exportCancelBtn").addEventListener('click', destroy, false);
    document.getElementById("exportBtn").addEventListener('click', (evt) => {
      if(isInfoCorrect()){
        getTaxonomyAndExport();
      }
    }, false);

  }

  function destroy(evt) {
    document.body.removeChild(modal);
  }

  function getTaxonomyAndExport(){
    api.v1.collection.graph(cID).done(graph => {
      var taxonomy = getTaxonomy(graph);

      api.v1.collection.entries(cID).done(entries => {
        var numberOfEntries = entries.length;
        var generalInformation = [];
        var rows = [];
        var firstRow = setHeaders(entries, generalInformation, taxonomy);
        rows.push(firstRow);

        function toCSV(entry) {
            return api.v1.entry.taxonomy(entry.id).then(entryTaxonomy => {
                return calculateCSVRow(entry, entryTaxonomy, taxonomy)
            })
        }
        var entryRows = entries.map(entry => {
            return toCSV(entry).then(csvRow => rows.push(csvRow));
        })

        Promise.all(entryRows).then(() => {
            var csvContent = rows.join('');
            exportToCSV(`${document.getElementById("exportFilename").value}.csv`, csvContent);
            destroy();
        })

      })
    })
  }

  function getTaxonomy(graph) {
    var taxonomy = new Set();
    graph.edges.forEach(edge => {
      taxonomy.add(edge.type);
    });
    return Array.from(taxonomy);
  }

  function setHeaders(entries, generalInformation, taxonomy) {
    var keys = Object.keys(entries[0]);
    generalInformation.push(...keys);
    return keys.concat(...taxonomy).join(document.getElementById("selectDelimiterCSV").value) + "\n";
  }

  function calculateCSVRow(entry, entryTaxonomy, taxonomy){
    var CSVDelimiter = document.getElementById("selectDelimiterCSV").value;
    var leafDelimiter = document.getElementById("selectDelimiterLeaf").value;
    var csvRow = Object.values(entry)
      .map(value => String(value))
      .join(CSVDelimiter);

    csvRow += CSVDelimiter;

    csvRow += taxonomy
      .map(key => entryTaxonomy[key])
      .map(val => val ? val.join(leafDelimiter) : "")
      .join(CSVDelimiter);

    csvRow += "\n";

    return csvRow;
  }

  function exportToCSV(filename, csvContent) {
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) { // IE 10+
          navigator.msSaveBlob(blob, filename);
      } else {
          var link = document.createElement("a");
          if (link.download !== undefined) { // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", filename);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      }
  }

  function createExportModal(){
    modal =
    el('div.modal#modal', [
        el('div', [
            el('div.close-btn#exportCloseBtn', ['']),
            el("h2", [`Export collection ${cName} (#${cID})` ]),
            el("div#exportFilenameWrapper", [
                el("input.modal-input-box#exportFilename", {type:"text", placeholder:"Filename"}),
                el("label", [" .csv"])
            ]),

            el("div.modal-divider"),
            delimiterDiv("CSV", "Select CSV delimiter "),
            el("div.modal-spacing"),
            delimiterDiv("Leaf", "Select taxonomy leaf delimiter "),
            el("div.modal-divider"),

            el("div", [
                el('button#exportBtn.btn', ["Export"]),
                el('button#exportCancelBtn.btn', ["Cancel"]),
            ])
        ])
    ]);
    setTimeout(() => modal.classList.add("appear"), 100);
    document.body.appendChild(modal);
  }

  function delimiterDiv(name, text){
    return  el("div", {id: "delimiter" + name}, [
                el("div.export-div-delimiter." + name, [
                    el("label", [text]),
                    el("select.export-select-delimiter", {id: "selectDelimiter" + name}, [
                        delimiters.map(delimiter =>
                        el('option', { value: delimiter.value }, [ delimiter.display ])),
                    ])
                ])
            ])
  }

  function isInfoCorrect(){
    clearComplaintsExport();
    var filenameValid = checkFileNameValidAndComplain();
    var delimitersValid = checkDelimitersValidAndComplain();
    if(filenameValid && delimitersValid){
      return true;
    }
    complain(document.getElementById("exportBtn").parentNode, "Incorrect input");
    return false;
  }

  function checkFileNameValidAndComplain(){
    if(document.getElementById("exportFilename").value){
      return true;
    }
    complain(document.getElementById("exportFilenameWrapper"), "Please supply information");
    return false;
  }

  function checkDelimitersValidAndComplain(){
    if(document.getElementById("selectDelimiterCSV").value !== document.getElementById("selectDelimiterLeaf").value) {
      return true;
    }
    complain(document.getElementById("delimiterCSV"), "The delimiters have to be different");
    return false;
  }

  function complain(node, text){
    node.appendChild(
        el("div.complaint.export", {text:"The delimiters have to be different"})
    );
  }

  function clearComplaintsExport(){
    $(".complaint.export").remove();
  }

})();
