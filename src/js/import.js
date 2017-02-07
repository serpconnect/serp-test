(function (){
  "use strict";

  window.import = {
    fromFile:importFromFile
  }

  var entryType = ""
  var researchMustHave = [
      {value: "reference", display: "Reference"}
  ];
  var researchOptional = [
      {value: "doi", display: "DOI"}
  ];
  var challengeMustHave = [
      {value: "description", display: "Description"}
  ];
  var extraHeaders = [
      {value: "contact", display: "Contact"},
      {value: "date", display: "Date"}
  ];
  var serpSecretHeaders = researchMustHave.concat(challengeMustHave.concat(researchOptional.concat(extraHeaders)));

  var intervention = ["Intervention"];
  var interventionLeaves = [
      {value: "intervention", display: "Supply interventions"},
  ];
  var effect = ["Effect"];
  var effectLeaves = [
      {value: "solving", display: "Solve new problem"},
      {value: "adapting", display: "Adapt testing"},
      {value: "assessing", display: "Assess testing"},
      {value: "improving", display: "Improve testing"}
  ];
  var scope = ["Scope"];
  var scopeLeaves = [
      {value: "planning", display: "Test planning"},
      {value: "design", display: "Test design"},
      {value: "execution", display: "Test execution"},
      {value: "analysis", display: "Test analysis"}
  ];
  var context = ["Context"];
  var contextLeaves = [
      {value: "people", display: "People related constraints"},
      {value: "information", display: "Availability of information"},
      {value: "sut", display: "Properties of SUT"},
      {value: "other", display: "Other"}
  ];
  var serpTaxonomyLeaves = interventionLeaves.concat(effectLeaves.concat(scopeLeaves.concat(contextLeaves)));

  var serp = serpSecretHeaders.concat(serpTaxonomyLeaves);

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

  function importFromFile(pushEntry){
    $("#input_file").click();
    $("#input_file").change(function(evt){
      var inputFiles = document.getElementById("input_file");
      if ('files' in inputFiles) {
        if (inputFiles.files.length > 0) {
          for (var i = 0; i < inputFiles.files.length; i++) {
              var file = inputFiles.files[i];
              var reader = new FileReader();
              reader.onload = function(){
                var data = reader.result.substring(0,file.size);
                if(file.name.indexOf(".json") != -1){
                  convertJsonfileToJsonAndQueue(data, pushEntry);
                }
                else if(file.name.indexOf(".csv") != -1){
                  convertCSVfiletoJsonAndQueue(data, pushEntry);
                } else {
                  alert("File has to be in either json or CSV format");
                }
              };
              reader.readAsText(file);
          }
        }
      }
      document.getElementById("input_file").value = "";
    });
  }

  function convertJsonfileToJsonAndQueue(data, pushEntry){
    var newCollectionModal = createjsonModal();

    window.modals.optionsModal(newCollectionModal,function (newCollectionName) {
      if(newCollectionName === ""){
        $('.complaint.import-json').remove();
        var error = this.modal.querySelector('input');
        error.parentNode.insertBefore(
          el('div.complaint.import-json', ["Please supply information"]), error.nextSibling
        );
      }
      else {
        var jsons = JSON.parse(data);
        var allEntries = jsonToEntry(jsons);
        var validEntries = allEntries.validEntries;

        if(printStatistics(allEntries, "json")){
          createCollection(validEntries, newCollectionName, pushEntry, modal);
        }
      }
    })
  }

  function createjsonModal(){
    return newCollectionModal = {
            desc: "Create new collection",
            message: "",
            //message above input boxes
            input: [['input0','text','collection name']],
            //[textbox names, types, placeholder] //else put '[]'
            //automatically takes input[0] as first paramater for method passed in.. etc
            btnText: "Create"
            //text on button
    };
  }

  function createCollection(validEntries, newCollectionName, pushEntry, modal){
    window.user.createCollection(newCollectionName)
    .done(ok => {
      var collectionID = ok.id;
      updateDisplayedCollectionName(collectionID, newCollectionName);
      pushEntries(collectionID, validEntries, pushEntry);
      destroy(modal);
    })
    .fail(xhr => {
      flashErrorMessage(xhr.responseText);
      destroy(modal);
    })
  }

  function destroy(modal) {
    document.body.removeChild(modal)
  }

  function updateDisplayedCollectionName(collectionID, newCollectionName){
    var collection = document.getElementById("collection");
    var option = el("option", {value:collectionID, text:newCollectionName});
    $("#collection").append(option);
    collection.value = collectionID;
  }

  function pushEntries(collectionID, validEntries, pushEntry){
    for(var i = 0; i < validEntries.length; i++){
      validEntries[i].collection = collectionID;
      pushEntry(validEntries[i]);
    }
  }

  function convertCSVfiletoJsonAndQueue(csv, pushEntry){
    var lines;
    var CSVHeaders;
    var modal = createImportModal();

    closeBtn.addEventListener('click', function() {
      destroy(modal);
    }, false);
    cancelBtn.addEventListener('click', function() {
      destroy(modal);
    }, false);

    selectDelimiter.addEventListener("change", function() {
      var delimiter = this.value;
      lines = CSVToArray(csv, delimiter);
      CSVHeaders = lines[0];
      $(".import-option").remove();
      for (var i = 0; i < CSVHeaders.length; i++){
        var option = el("option.import-option", {value:CSVHeaders[i]}, [CSVHeaders[i]]);
        $(".import-select").append(option);
      }
    });

    importCheckResearch.addEventListener('change', (evt) => {
      clearComplaintsImportHeaders();
      if (document.getElementById("importCheckResearch").checked) {
        entryType = "research";
        $(".import-serp-select-wrapper.research").show().css("color", "red");
        $(".import-serp-select-wrapper.challenge").hide().css("color", "");
        $(".import-serp-select-wrapper.researchOptional").show();
        document.getElementById("importCheckChallenge").checked = false;
      } else {
        entryType = "nothing";
        $(".import-serp-select-wrapper.research").show().css("color", "");
        $(".import-serp-select-wrapper.challenge").show().css("color", "");
        $(".import-serp-select-wrapper.researchOptional").show();
      }
    });
    importCheckChallenge.addEventListener('change', (evt) => {
      clearComplaintsImportHeaders();
      if (document.getElementById("importCheckChallenge").checked) {
        entryType = "challenge";
        $(".import-serp-select-wrapper.research").hide().css("color", "");
        $(".import-serp-select-wrapper.challenge").show().css("color", "red");
        $(".import-serp-select-wrapper.researchOptional").hide();
        document.getElementById("importCheckResearch").checked = false;
      } else {
        entryType = "nothing";
        $(".import-serp-select-wrapper.research").show().css("color", "");
        $(".import-serp-select-wrapper.challenge").show().css("color", "");
        $(".import-serp-select-wrapper.researchOptional").show();
      }
    });
    //Default entrytype is research and default delimiter is comma.
    document.getElementById("importCheckResearch").click();
    document.getElementById("selectDelimiter").dispatchEvent(new Event('change'));
    $(".import-select").css("visibility", "hidden");

    $(".import-checkbox").click(function() {
      if($(this).is(":checked")){
        $(this).parent().find(".import-select").css("visibility", "visible");
      } else {
        $(this).parent().find(".import-select").css("visibility", "hidden");
      }
    });

    uploadBtn.addEventListener('click', (evt) => {
      clearComplaintsImport();
      var newCollectionName = document.getElementById("importCollectionName").value;
      var collectionNameValid = isCollectionNameValid(newCollectionName);
      var entryTypeValid = isEntryTypeDataValid();

      if(collectionNameValid && entryTypeValid){
        var jsons = createjsons(lines, CSVHeaders);
        var allEntries = jsonToEntry(jsons);
        var validEntries = allEntries.validEntries;

        if (printStatistics(allEntries, "CSV")){
            createCollection(validEntries, newCollectionName, pushEntry, modal);
        }
      }
    });
  }

  function clearComplaintsImport(){
    $("#collectionComplaint").remove();
    $("#entryTypeComplaint").remove();
    clearComplaintsImportHeaders();
  }

  function clearComplaintsImportHeaders(){
    $(".complaint.import-CSV").remove();
  }

  function createImportModal(){
    var modal =
    el('div.modal', [
      el('div', [
        el('div.close-btn#closeBtn', ['']),
        el("h2", ["Mapping CVS columns to taxonomy"]),
        el("div.modal-divider"),
        el("div#importCollectionWrapper", [
          el("input.modal-input-box#importCollectionName",
              {type:"text", placeholder:"Name of new collection"}),
        ]),
        el("div.modal-divider"),

        el("div.import-serp-select-complaint-wrapper." + "delimiter", [
          el("div.import-serp-select-wrapper." + "delimiter", [
            el("label", ["Select delimiter"]),
            el("select#selectDelimiter", [
              delimiters.map(delimiter =>
              el('option', { value: delimiter.value }, [ delimiter.display ])),
            ])
          ])
        ]),

        el("h1", ["Select your mapping"]),
        el("div#importEntryTypeWrapper", [
          el("div.import-checkbox-heading", ["Entry type "]),
          el("label", ["Research "]),
          el("input#importCheckResearch", {type:"checkbox"}),
          el("label", ["Challenge "]),
          el("input#importCheckChallenge", {type:"checkbox"}),
        ]),
        el("div.modal-divider"),

        el("h3", ["General information"]),

        mapToHeaders("research", researchMustHave),

        mapToHeaders("challenge", challengeMustHave),

        mapToHeaders("researchOptional", researchOptional),

        mapToHeaders("extraHeaders", extraHeaders),

        el("div.modal-divider"),
        el("h3", ["Taxonomy"]),

        el("div.taxonomy-heading", intervention),
        mapToHeaders("intervention", interventionLeaves),

        el("div.taxonomy-heading", effect),
        mapToHeaders("effect", effectLeaves),

        el("div.taxonomy-heading", scope),
        mapToHeaders("scope", scopeLeaves),

        el("div.taxonomy-heading", context),
        mapToHeaders("context", contextLeaves),

        el("div.modal-divider"),
        el('button#uploadBtn.btn', ["Upload"]),
        el('button#cancelBtn.btn', ["Cancel"])
      ])
    ]);
    setTimeout(() => modal.classList.add("appear"), 100)
    document.body.appendChild(modal);
    return modal;
  }

  function mapToHeaders(serp, serpArray){
    return serpArray.map(serpItem => {
      var serps =
      el("div.import-serp-select-complaint-wrapper." + serp, [
        el("div.import-serp-select-wrapper." + serp, [
          el("label", [serpItem.display]),
          el("div.import-checkbox-and-select." + serp, [
            el("input.import-checkbox." + serp, {type:"checkbox"}),
            el("select.import-select." + serp, [
              el("option", {value:"unspecified"}, ["ignore"]),
            ])
          ])
        ])
      ])
      return serps;
  })
}

  function isCollectionNameValid(newCollectionName){
    if(newCollectionName === ""){
      document.getElementById("importCollectionWrapper").appendChild(
        el("div.complaint#collectionComplaint", {text:"Please supply information"})
      );
      return false;
    }
    return true;
  }

  function isEntryTypeDataValid(){
    var validEntryTypeData = true;
    if(entryType === "nothing"){
      validEntryTypeData = false;
      document.getElementById("importEntryTypeWrapper").appendChild(
        el("div.complaint#entryTypeComplaint", {text:"Please supply information"})
      );
    }
    else if(entryType === "research" ){
      var nothing = $(".import-checkbox.research").filter(":not(:checked)");
      nothing.parent().parent().parent().append(el("div.complaint.import-CSV", {text:"Please supply information"}));
      validEntryTypeData = !nothing.length
    }
    else if (entryType === "challenge" ){
      var nothing = $(".import-checkbox.challenge").filter(":not(:checked)");
      nothing.parent().parent().parent().append(el("div.complaint.import-CSV", {text:"Please supply information"}));
      validEntryTypeData = !nothing.length
    }
    return validEntryTypeData;
  }

  function createjsons(lines, CSVHeaders){
    var selected = $(".import-checkbox").filter(":checked").
          parent().find(".import-select").map((i, e) => e.value).toArray();
    var labels = $(".import-checkbox").filter(":checked").
          parent().parent().find("label").map((i, e) => e.textContent).toArray();
    var jsons = [];
    for(var i=1;i<lines.length;i++){
      var currentLine = lines[i];
      var obj = {};
      var serpClassification = {};
      for(var j=0;j<selected.length;j++){
        var currentHeader = serp.find(value => value.display === labels[j]);
        var isTaxonomyLeave = serpTaxonomyLeaves.indexOf(currentHeader) !== -1;
        if(selected[j] !== "unspecified"){
          var currentCell = currentLine[CSVHeaders.indexOf(selected[j])];
          //Check that the cell is not empty.
          if(currentCell) {
              //Check if currentHeader is a taxonomy leave.
              if(isTaxonomyLeave){
                var serpArray = [];
                //The taxonomy leave can be a vector of strings. Split on comma.
                var taxonomyLeaveStrings = currentCell.split(",");
                for(var k = 0; k < taxonomyLeaveStrings.length; k++){
                  serpArray.push(taxonomyLeaveStrings[k]);
                }
                serpClassification[currentHeader.value] = serpArray;
              } else {
                obj[currentHeader.value] = currentCell;
              }
          }
        } else {
          if(isTaxonomyLeave){
            serpClassification[currentHeader.value] = ["unspecified"];
          } else {
            obj[currentHeader.value] = "unspecified";
          }
        }
      }
      obj.serpClassification = serpClassification;
      obj.entryType = entryType;
      jsons.push(obj);
    }
    return jsons;
  }

  // Function is taken from stackoverflow,
  // which in turn is taken from the blog:
  // https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
  // Here, it has been modified to not include empty lines in the CSV,
  // and also fixed a bug so it does not always push an empty line at the end.
  //
  // ref: http://stackoverflow.com/a/1293163/2343
  // This will parse a delimited string into an array of
  // arrays. The default delimiter is the comma, but this
  // can be overriden in the second argument.
  function CSVToArray( strData, strDelimiter ){
      // Check to see if the delimiter is defined. If not, then default to comma.
      strDelimiter = (strDelimiter || ",");
      // Create a regular expression to parse the CSV values.
      var objPattern = new RegExp(
          (
              // Delimiters.
              "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
              // Quoted fields.
              "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
              // Standard fields.
              "([^\"\\" + strDelimiter + "\\r\\n]*))"
          ),
          "gi"
          );
      // Create an array to hold our data. Give the array a default empty first row.
      var arrData = [[]];
      // Create an array to hold our individual pattern matching groups.
      var arrMatches = null;
      // emptyRow is true until you stumble upon a cell that has a value that is not "".
      var emptyRow = true;
      // Keep looping over the regular expression matches until we can no longer find a match.
      while (arrMatches = objPattern.exec( strData )){
          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ];
          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if (
              strMatchedDelimiter.length &&
              strMatchedDelimiter !== strDelimiter
              ){
                // If the last row was empty, remove it from the array.
                if(emptyRow){
                    arrData.pop();
                  }
                  emptyRow = true;
                  // Since we have reached a new row of data, add an empty row to our data array.
                  arrData.push( [] );
          }
          var strMatchedValue;
          // Now that we have our delimiter out of the way,
          // let's check to see which kind of value we captured (quoted or unquoted).
          if (arrMatches[ 2 ]){
              // We found a quoted value. When we capture
              // this value, unescape any double quotes.
              strMatchedValue = arrMatches[ 2 ].replace(
                  new RegExp( "\"\"", "g" ),
                  "\""
                  );
          } else {
              // We found a non-quoted value.
              strMatchedValue = arrMatches[ 3 ];

          }
          if(strMatchedValue != ""){
              emptyRow = false;
          }
          // Now that we have our value string, let's add
          // it to the data array.
          arrData[ arrData.length - 1 ].push( strMatchedValue );
      }
      // A row with just 1 empty element is sometimes added to the array.
      // If that's the case, remove it.
      if(arrData[arrData.length - 1].length != arrData[0]){
        arrData.pop();
      }
      // Return the parsed data.
      return( arrData );
  }

  function jsonToEntry(jsons){
    var allEntries = {};
    var validEntries = [];
    var invalidEntries = [];
    for(var i = 0; i < jsons.length; i++){
      var curjson = jsons[i];
      var curEntryType = curjson.entryType;
      if(!curEntryType){
        invalidEntries.push(i+1);
        continue;
      }
      else if(curEntryType === "challenge"){
        curjson.reference = "";
        curjson.doi = "";
        if(!curjson.description){
          invalidEntries.push(i+1);
          continue;
        }
      } else if (curEntryType === "research"){
        if(curjson.doi === undefined){
          curjson.doi = "";
        }
        curjson.description = "";
        if(!curjson.reference){
          invalidEntries.push(i+1);
          continue;
        }
      } else {
        invalidEntries.push(i+1);
        continue;
      }

      curjson.date = new Date(curjson.date);
      if(curjson.date === undefined || isNaN(curjson.date.getTime())){
         curjson.date = new Date();
      }

      var curEntry = {
          entryType: curjson.entryType,
          reference: curjson.reference,
          doi: curjson.doi,
          description: curjson.description,
          contact: curjson.contact,
          date: curjson.date,
          serpClassification: curjson.serpClassification
      };
      validEntries.push(curEntry);
    }

    allEntries.validEntries = validEntries;
    allEntries.invalidEntries = invalidEntries;
    return allEntries;
  }

  function printStatistics(allEntries, fileType){
    var entriesFormat = "The entries must follow that:\n"
                      + "\"challenge\" entries must have a description.\n"
                      + "\"research\" entries must have a reference.";

    var queueQuestion = "Do you want to queue the "
                      + allEntries.validEntries.length
                      + " valid entries?";

    var notEnoughInformation = "does not have enough information to make entries.";

    var typePlural;
    var specifiedEntries;
    if(fileType === "json"){
      typePlural = " json objects ";
      specifiedEntries = "The json objects with index " + allEntries.invalidEntries.toString() + " ";
    } else if(fileType === "CSV"){
      typePlural = " rows in the CSV ";
      specifiedEntries = "The CSV rows " + allEntries.invalidEntries.toString()
        + " (counting starts after the headers row and empty rows are not counted) ";
    }

    if(allEntries.validEntries.length === 0){
      alert("0" + typePlural + "are valid.\n\n"
      + entriesFormat);
      return false;
    }
    //Could be any number but if there are too many the alert box will be difficult to read.
    else if(allEntries.invalidEntries.length > 50){
      return confirm(allEntries.invalidEntries.length
      + typePlural + notEnoughInformation + "\n\n"
      + entriesFormat + "\n\n"
      + queueQuestion);
    }else if(allEntries.invalidEntries.length > 0){
      return confirm(specifiedEntries
      + notEnoughInformation + "\n\n"
      + entriesFormat + "\n\n"
      + queueQuestion);
    } else {
      return true;
    }
  }

})();
