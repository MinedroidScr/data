var network; // block w/ graph
var buttonsBlock;
var linksBlock;
var mainContent;
var n_history = [];

var nodes_arr = new vis.DataSet(); // array for nodes. used to update them dynamically
var edges_arr = new vis.DataSet(); // same for references

function initPage() {
    fitElements();
    initGraph();
    buttonsBlock = document.getElementsByClassName("buttonsBlock")[0]; // block where buttons will be
    linksBlock = document.getElementsByClassName("linksBlock")[0]; // block where links will be
    linksHost = document.getElementsByClassName("linksHost")[0]; // block where links will be
    mainContent = document.getElementsByClassName("mainContent")[0]; // block where info and graph will be

    formattedArray = createFormattedArrayFromSource(); //formattedArray array contains all elements w/o char splitting // array: [[word, descr, refs], [word, descr, refs], ..]
    charsData = sortByChars(formattedArray); //split array by chars (array: {A: [[id, word],[id, word],..], B:[[id, word],[id, word],..], ....})

    for (var char in charsData) {
        newButton(char); //create char button
    }

    /*newButton("EN", function () { // language here
        alert('it must change language')
    }, "float:right; margin:5px;");*/

    bck.onclick = function () { // back button event
        mainContentFill(n_history[n_history.length - 2]);
        n_history.splice(n_history.length - 1, 1);
        n_history = n_history;
        if (n_history.length == 1)
            this.style.display = "none";
    }

    linkHandler({
        id: currentWord
    }); // toggle current word specified in data.js
}

function fitElements() {
    var graphParent = document.getElementsByClassName("graphParent")[0];
    var infoBlock = document.getElementsByClassName("info")[0];
    var margin = 10;
    var infoHeight = 150;
    graphParent.style.height = window.innerHeight - margin * 2 - infoHeight - 40 + "px";
    graphParent.style.margin = margin + "px";
    infoBlock.style.height = infoHeight - 2 * margin + "px";
    infoBlock.style.margin = margin + "px";
    //(typeof(network)=="undefined")?false:network.fit();
}


function initGraph() { // called one time to create network object
    nodes_arr.add({}); //init dataset
    edges_arr.add({}); //init dataset

    var container = document.getElementById('graphhost'); // div where graph will be
    var data = {
        nodes: nodes_arr, // elements of graph
        edges: edges_arr // references
    };
    var options = {
        edges: {
            smooth: false /* IMPORTANT */
        },
        nodes: {
            shape: 'box',
            margin: 10,
            font: {
                color: '#343434',
                size: 24, // px
                face: 'arial',
            }
        },
        physics: {
            enabled: false
        },
        interaction: {
            hover: true,
            dragNodes: false
        }
    };

    network = new vis.Network(container, data, options);

    network.on("click", function (params) {
        (
            (typeof this.getNodeAt(params.pointer.DOM) == "undefined") ||
            (network.body.data.nodes._data[this.getNodeAt(params.pointer.DOM)].mainNode)
        ) ? "" : nodeHandler(this.getNodeAt(params.pointer.DOM))
    }); // handle graph element click
}

function drawGraphForId(id) {
    var nodes_ = [];
    var edges_ = [];

    nodes_.push({ //insert main node
        chosen: false,
        mainNode: true,
        color: "#D2E5FF",
        border: "#2B7CE9",
        id: id,
        x: 0,
        y: 0,
        label: formattedArray[id][0]
    });
    [].forEach.call(formattedArray[id][2], function (ref) {
        edges_.push({ //connect  main node to others
            from: id,
            to: ref
        });
        nodes_.push({ //insert linked nodes
            chosen: false,
            mainNode: false,
            id: ref,
            label: formattedArray[ref][0]
        });
    });

    nodes_arr.clear();
    edges_arr.clear();
    nodes_arr.update(nodes_);
    edges_arr.update(edges_);

    alignNodes();
}

function alignNodes() {
    var margin_h = 5; // margin btw blocks in height ** SETTING **
    var margin_w = 5; // margin btw blocks in width ** SETTING **

    var mw = 0; // max width
    var summh = 0; // all height/2
    var c = 0; // nodes count w/o main block
    var x_ = 0; // main node width/2 + 2*margin_w
    var nodes = network.nodesHandler.body.nodes; // all nodes array
    for (var i in nodes) { // all nodes cycle
        // find all blocks height/2 (w/o main)
        if (!nodes[i].options.mainNode) {
            summh += nodes[i].shape.height / 2 + margin_h;
            c++;
            // find max block width//
            if (mw < nodes[i].shape.width)
                mw = nodes[i].shape.width;
        } else {
            x_ = nodes[i].shape.width / 2 + margin_w * 2; //main node width/2+margin
        }
    }

    var y_ = summh / 2; // max y coordinate
    var n = 0; // nodes count

    // now i dont envy u, i cant normally explain what happens there ->

    for (var i in nodes) {
        if (!nodes[i].options.mainNode) { // dont touch main node
            if (n * (summh / c) >= summh / 2) { // if nodes filled one half -> x = -x, n=0
                x_ = -x_;
                n = 0;
            }
            network.moveNode(i, -x_ + -(x_ / Math.abs(x_)) * (nodes[i].shape.width / 2), // x:1, y:1 is IV quarter on cricle
                -y_ + n * (summh * 2 / c) // *n* positions up\down
            );
            n++;
        }
    }

    // add 4 invisible nodes to mark borders
    nodes_arr.update([{
        id: "fit1",
        x: 0 - mw - margin_w - Math.abs((x_ - margin_w * 2)),
        y: summh / 2,
        shape: "text" // shape:text using to hide node, little h4x
    }]); // nodes hidden:true wont change view when using fit()
    nodes_arr.update([{
        id: "fit3",
        x: 0 - mw - margin_w - Math.abs((x_ - margin_w * 2)),
        y: -summh / 2,
        shape: "text"
    }]);
    nodes_arr.update([{
        id: "fit2",
        x: 0 + mw + margin_w + Math.abs((x_ - margin_w * 2)),
        y: -summh / 2,
        shape: "text"
    }]);
    nodes_arr.update([{
        id: "fit4",
        x: 0 + mw + margin_w + Math.abs((x_ - margin_w * 2)),
        y: summh / 2,
        shape: "text"
    }]);

    network.fit(); // fit zoom depending on nodes
}

function newButton(name, func, style) { //create button
    var btn = document.createElement("button");
    btn.className = "headBtn";
    btn.innerHTML = name;
    if (!func)
        btn.onclick = function () {
            buttonHandler(this)
        }
    else // create custom event if specified
        btn.onclick = func;
    if (style) // set style if specified
        btn.style.cssText = style;
    buttonsBlock.appendChild(btn);
}

function buttonHandler(b) { //called when any of header buttons clicked
    mainContent.style.display = "none";
    linksBlock.style.display = ""; //hide info and show links
    n_history = [];

    var char = b.innerHTML; // current called char
    linksHost.innerHTML = ""; // clear links area before inserting smth
    var tb = document.createElement("table");
    linksHost.appendChild(tb);
    var curr_height = 0;
    var link_height = 20;
    var link_margin = 5;
    tb.appendChild(ctd());
    for (var i in charsData[char]) {
        var id = charsData[char][i][0]; // charsData array:  {A: [[id, word],[id, word],..], B:[[id, word],[id, word],..], ....}
        var word = charsData[char][i][1];
        var a = document.createElement("a");
        var b = document.createElement("br");
        a.onclick = function () {
            linkHandler(this);
        };
        a.id = id;
        a.innerHTML = word;

        curr_height += link_height + link_margin * 2;

        if (curr_height - 40 > window.innerHeight) {
            tb.appendChild(ctd());
            curr_height = 0;
        }

        tb.childNodes[tb.childNodes.length - 1].appendChild(a);
        tb.childNodes[tb.childNodes.length - 1].appendChild(b);
    }
}

function ctd() {
    return document.createElement("td");
}


function linkHandler(l) { //called when any link clicked
    mainContent.style.display = "";
    linksBlock.style.display = bck.style.display = "none"; // hide links and back button, show info
    n_history.push(l.id);
    mainContentFill(l.id);
}

function nodeHandler(id) { //called when any of nodes clicked
    if (typeof id == "number") { //to prevent adding fit nodes to history
        n_history.push(id); // add clicked node to history array
        bck.style.display = (n_history.length == 1 ? "none" : ""); // hide history button if this is first clicked node 
        mainContentFill(id); // prepare graph to init
    }
}

function mainContentFill(id) { // show info about choosen value (show descr and graph)
    drawGraphForId(id);
    var curr = formattedArray[id]; // current element options
    document.getElementsByClassName("text")[0].innerHTML = "<h1>" + curr[0] + "</h1><br>" + curr[1];
    //    ->                                                                      if there's no descr - it wont show
}

function sortByChars(arr) { //split array by first word char
    var new_arr = {};
    for (var i in words) {
        var firstChar = firstCharWoSpecials(words[i].word);
        var elId = parseInt(words[i].id);
        if (typeof new_arr[firstChar] == "undefined") // array: {A: [[id, word],[id, word],..], B:[[id, word],[id, word],..], ....}
            new_arr[firstChar] = [
                [elId, words[i].word]
            ]
        else new_arr[firstChar].push([elId, words[i].word]);
    }
    return new_arr;
}

function createFormattedArrayFromSource() {
    var farr = {};
    for (var i in nodes) {
        farr[nodes[i].id] = [nodes[i].label, nodes[i].comment, getAllReferences(nodes[i].id)];
    }
    return farr;
}

function getAllReferences(id) {
    var refs = [];
    for (var i in edges) {
        if (edges[i].to == id)
            refs.push(edges[i].from)
        if (edges[i].from == id)
            refs.push(edges[i].to)
    }
    return refs;
}

function firstCharWoSpecials(txt) { // get first char of word
    for (var i in txt) {
        if (!(txt[i].toLowerCase() == txt[i].toUpperCase() && (i < txt.length - 1)))
            return txt[i].toUpperCase();
    }
}
