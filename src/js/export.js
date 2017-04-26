(function (){
  "use strict";

  window.export = {
    toFile:exportCollectionToFile
  }

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
    var modal = createExportModal();

    // Comma should probably not be the default delimiter
    // since a lot of the entries contain commas. 
    selectDelimiterCSV.selectedIndex = 1;
    selectDelimiterLeaf.selectedIndex = 3;

    closeBtn.addEventListener('click', function() {
      document.body.removeChild(modal);
    }, false);

    cancelBtn.addEventListener('click', function() {
      document.body.removeChild(modal);
    }, false);

    exportBtn.addEventListener('click', (evt) => {
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

  function getTaxonomyAndExport(taxonomy){
    window.api.ajax("GET", window.api.host + "/v1/collection/" + cID + "/graph").done(graph => {
      var taxonomy = getTaxonomy(graph);

      window.api.ajax("GET", window.api.host + "/v1/collection/" + cID + "/entries").done(entries => {
        var numberOfEntries = entries.length;
        var generalInformation = new Set();
        var rows = [];
        var firstRow = setHeaders(entries, generalInformation, taxonomy);
        rows.push(firstRow);

        entries.forEach(function(entry) {
          addEntry(rows, entry, generalInformation, taxonomy, numberOfEntries);
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
    return taxonomy;
  }

  function setHeaders(entries, generalInformation, taxonomy){
    var firstRow = "";
    Object.keys(entries[0]).forEach(function(key,index) {
      generalInformation.add(key);
      if(index > 0)
        firstRow += CSVDelimiter;
      firstRow += key;
    });

    taxonomy.forEach(leaf => {
      firstRow += CSVDelimiter + leaf;
    });
    firstRow += "\n";
    return firstRow;
  }

  function addEntry(rows, entry, generalInformation, taxonomy, numberOfEntries){
    window.api.ajax("GET", window.api.host + "/v1/entry/" + entry.id + "/taxonomy").done(entryTaxonomy => {
      var curRow = calculateCurRow(entry, entryTaxonomy, generalInformation, taxonomy);
      rows.push(curRow);

      // Check if all entries have been added ( > because the first row in rows contains the headers).
      if(rows.length > numberOfEntries){
        var csvContent = "";
        rows.forEach(row => {
          csvContent += row;
        });
        exportToCSV(filename + ".csv", csvContent);
      }
    })
  }

  function calculateCurRow(entry, entryTaxonomy, generalInformation, taxonomy){
    var curRow = "";
    var firstKey = true;
    generalInformation.forEach(function(key) {
      if(!firstKey)
        curRow += CSVDelimiter;
      if(entry[key] !== undefined) {
        curRow += entry[key];
      } else {
        curRow += "";
      }
      firstKey = false;
    });

    taxonomy.forEach(function(key) {
      curRow += CSVDelimiter;
      if(entryTaxonomy[key] !== undefined) {
        var firstLeaf = true;
        entryTaxonomy[key].forEach(leaf => {
          if(!firstLeaf)
            curRow += leafDelimiter;
          curRow += leaf;
          firstLeaf = false;
        });
      } else {
        curRow += "";
      }
    });
    curRow += "\n";
    return curRow;
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
    var modal =
    el('div.modal', [
        el('div', [
            el('div.close-btn#closeBtn', ['']),
            el("h2", ["Export Collection " + cName + " (#" + cID + ")"]),
            el("div#exportFilenameWrapper", [
                el("input.modal-input-box#exportFilename", {type:"text", placeholder:"Filename"}),
                el("label", [" .csv"])
            ]),

            el("div.modal-divider"),
            delimiterDiv("CSV", "Select CSV delimiter "),
            el("div.modal-divider"),
            delimiterDiv("Leaf", "Select taxonomy leaf delimiter "),
            el("div.modal-divider"),

            el("div", [
                el('button#exportBtn.btn', ["Export"]),
                el('button#cancelBtn.btn', ["Cancel"]),
            ])
        ])
    ]);
    setTimeout(() => modal.classList.add("appear"), 100)
    document.body.appendChild(modal);
    return modal;
  }

  function delimiterDiv(name, text){
    return  el("div#delimiter" + name, [
                el("label", [text]),
                el("select#selectDelimiter" + name, [
                    delimiters.map(delimiter =>
                    el('option', { value: delimiter.value }, [ delimiter.display ])),
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
