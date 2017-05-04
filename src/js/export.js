(function (){
  "use strict";

  window.export = {
    toFile:exportCollectionToFile
  }

  var modal;
  var cID;
  var cName;
  var filename;
  var CSVDelimiter;
  var leafDelimiter;

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

    document.getElementById("exportCloseBtn").addEventListener('click', (evt) => {
      destroy(modal);
    }, false);

    document.getElementById("exportCancelBtn").addEventListener('click', (evt) => {
      destroy(modal);
    }, false);

    document.getElementById("exportBtn").addEventListener('click', (evt) => {
      clearComplaintsExport();
      filename = document.getElementById("exportFilename").value;
      var filenameValid = isFilenameValid();
      var delimitersValid = areDelimitersValid();
      if(!filenameValid || !delimitersValid){
        $(exportBtn).parent().append(
          el("div.complaint.export", {text:"Incorrect input"})
        );
        return;
      }

      getTaxonomyAndExport();
    }, false);

  }

  function destroy(modal) {
    document.body.removeChild(modal);
  }

  function getTaxonomyAndExport(taxonomy){
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
            exportToCSV(`${filename}.csv`, csvContent);
            destroy(modal);
        })

      })
    })
  }

  function getTaxonomy(graph) {
    var taxonomy = new Set();
    var edges = graph.edges;
    edges.forEach(edge => {
      var type = edge.type;
      taxonomy.add(type);
    });
    return Array.from(taxonomy);
  }

  function setHeaders(entries, generalInformation, taxonomy) {
    var keys = Object.keys(entries[0]);
    generalInformation.push(...keys);
    return keys.concat(...taxonomy).join(CSVDelimiter) + "\n";
  }

  function calculateCSVRow(entry, entryTaxonomy, taxonomy){
    var csvRow = Object.values(entry)
      .map(value => {return String(value)})
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
    el('div.modal', [
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
    setTimeout(() => modal.classList.add("appear"), 100)
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

  function isFilenameValid(){
    if(filename === ""){
      document.getElementById("exportFilenameWrapper").appendChild(
          el("div.complaint.export", {text:"Please supply information"})
      );
      return false;
    }
    return true;
  }

  function areDelimitersValid(){
    CSVDelimiter = selectDelimiterCSV.value;
    leafDelimiter = selectDelimiterLeaf.value;
    if(CSVDelimiter === leafDelimiter){
      document.getElementById("delimiterCSV").appendChild(
          el("div.complaint.export", {text:"The delimiters have to be different"})
      );
      return false;
    }
    return true;
  }

  function clearComplaintsExport(){
    $(".complaint.export").remove();
  }

})();
