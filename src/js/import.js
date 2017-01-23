(function (){
  "use strict";

  window.import = {
    fromFile:importFromFile
  }

  var entryType = ""
  var researchMustHave = ["reference"];
  var researchOptional = ["doi"];
  var challengeMustHave = ["description"];
  var extraHeaders = ["contact", "date"];
  var serp_secret_headers = researchMustHave.concat(challengeMustHave.concat(researchOptional.concat(extraHeaders)));
  var serp_taxonomy_leaves = ["Supply interventions",
                              "Solve new problem",
                              "Adapt testing",
                              "Assess testing",
                              "Improve testing",
                              "Test planning",
                              "Test design",
                              "Test execution",
                              "Test analysis",
                              "People related constraints",
                              "Availability of information",
                              "Properties of SUT",
                              "Other"];
  var serp = serp_secret_headers.concat(serp_taxonomy_leaves);
  var serp_taxonomy_leaves_true = ["intervention",
                                   "solving", "adapting", "assessing",
                                   "improving", "planning", "design",
                                   "execution", "analysis", "people",
                                   "information", "sut", "other"];

  var delimiters = ["Comma (,)" , "Semi-colon (;)" , "Colon (:)" , "Pipe (|)" , "Caret (^)", "Tilde (~)" , "Tab" , "Space"];
  var delimitersTrue = ["," , ";" , ":" , "|" , "^", "~" , "\t", " "];

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
      var delimiter = document.getElementById("selectDelimiter").value;
      var trueDelimiter = delimitersTrue[delimiters.indexOf(delimiter)];
      lines = CSVToArray(csv, trueDelimiter);
      CSVHeaders = lines[0];
      $(".import-option").each(function() {
        $(this).remove();
      });
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

    uploadBtn.addEventListener('click', (evt) => {
      clearComplaintsImport();
      var newCollectionName = document.getElementById("importCollectionName").value;
      var collectionNameValid = isCollectionNameValid(newCollectionName);
      var entryTypeValid = isEntryTypeDataValid();

      if(collectionNameValid && entryTypeValid){
        var selected = [];
        $(".import-select").each(function() {
          selected.push($(this).val());
        });

        var jsons = createjsons(selected, lines, CSVHeaders);
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

        el("div.import-serp-select-complaint-wrapper.", [
          el("div.import-serp-select-wrapper.", [
            el("label", ["Select delimiter"]),
            el("select#selectDelimiter", [
              delimiters.map(function (e) {
                return el("option", {value:e}, [e]);
              })
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

        el("div.import-heading", ["General information"]),

        mapToHeaders("research", researchMustHave),

        mapToHeaders("challenge", challengeMustHave),

        mapToHeaders("researchOptional", researchOptional),

        mapToHeaders("extraHeaders", extraHeaders),

        el("div.modal-divider"),
        el("div.import-heading", ["Taxonomy"]),

        mapToHeaders("leave", serp_taxonomy_leaves),

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
    return serpArray.map(function (h,i) {
      var serps =
      el("div.import-serp-select-complaint-wrapper." + serp, [
        el("div.import-serp-select-wrapper." + serp, [
          el("label", [h]),
          el("select.import-select."+serp, [
            el("option", {value:"nothing"}, ["ignore"]),
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
      var nothing = $(".import-select.research").filter((i,e) => e.value === "nothing");
      nothing.parent().parent().append(el("div.complaint.import-CSV", {text:"Please supply information"}));
      validEntryTypeData = !nothing.length
    }
    else if (entryType === "challenge" ){
      var nothing = $(".import-select.challenge").filter((i,e) => e.value === "nothing");
      nothing.parent().parent().append(el("div.complaint.import-CSV", {text:"Please supply information"}));
      validEntryTypeData = !nothing.length
    }
    return validEntryTypeData;
  }

  function createjsons(selected, lines, CSVHeaders){
    var jsons = [];
    for(var i=1;i<lines.length;i++){
      var obj = {};
      var currentline = lines[i];
      var serpClassification = {};
      for(var j=0;j<serp.length;j++){
        var currentcell = currentline[CSVHeaders.indexOf(selected[j])];
        //Check that the cell is not empty.
        if(currentcell) {
          if(selected[j] != "nothing"){
            var currentHeader = serp[j];
            var serpIndex = serp_taxonomy_leaves.indexOf(currentHeader);
            if(serpIndex !== -1){
              var serpArray = [];
              //The leave can be a vector of strings. Split on comma.
              var taxonomyLeaveStrings = currentcell.split(",");
              for(var k = 0; k < taxonomyLeaveStrings.length; k++){
                serpArray.push(taxonomyLeaveStrings[k]);
              }
              var trueSerp = serp_taxonomy_leaves_true[serpIndex];
              serpClassification[trueSerp] = serpArray;
            }else {
              obj[currentHeader] = currentcell;
            }
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
                      + "\"research\" entries must have a reference and a doi.";

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
