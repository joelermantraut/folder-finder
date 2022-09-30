const fs = require('fs');
const path = require('path');
const exec = require("child_process").exec;
const { ipcRenderer } = require('electron');

// IMPORTS 

add_element = function (parent, child, properties) {
    /*
     * Adds elements to parent in DOM.
    */
    var node = document.createElement(child);

    for (const [key, value] of Object.entries(properties)) {
        node[key] = value;
    }

    parent.appendChild(node);

    return parent.children[parent.children.length - 1];
}

get_el_coord = function (element) {
    /*
     * Gets Rect object and return tuple containing 
     * top, left, right, bottom, x, y, width and height.
    */
    var objRect = element.getBoundingClientRect();
    return objRect;
}

run_search = function(path) {
    /*
     * Runs search of all files in directory. 
    */
    if (path == undefined) {
        path = process.cwd();
        // If no path, actual path default
    }

    let files = undefined;
    try {
        files = fs.readdirSync(path);
    } catch (error) {
        console.log(error);
    }

    return files;
}

searcher = function(filelist, key) {
    new_filelist = [];
    filelist.forEach(file => {
        if (file.includes(key))
            new_filelist.push(file)
    });

    return new_filelist;
}

// FUNCTIONS 

window.onload = function() {
    const fileDir = path.join(__dirname, '/files/dir.cfg');
    const favDir = path.join(__dirname, '/files/fav.cfg');

    // CONSTANTS

    let indicador = document.getElementsByClassName("search")[0].getElementsByTagName("p")[0];
    let input = document.getElementsByClassName("search")[0].getElementsByTagName("input")[0];
    let lista = document.getElementsByClassName("list")[0];
    let close_button = document.getElementsByClassName("icon-close")[0];
    let config_button = document.getElementsByClassName("icon-config")[0];
    let favs_button = document.getElementsByClassName("icon-mark")[0];
    
    var mode = "search";
    
    var mainFolder = fs.readFileSync(fileDir, 'utf8').replace('\n', '');
    var mainDir = mainFolder;
    
    // ELEMENTS
    
    close_button.addEventListener("click", function(event) {
        ipcRenderer.send('close');
    });
    
    config_button.addEventListener('click', function(event) {
        mode = "config";

        input.value = mainFolder;
        // Sets main folder name in input to edit it

        indicador.innerText = "Presiona ENTER para cambiar la carpeta principal"

        let items = Array.from(lista.getElementsByTagName('li'));
        items.forEach(item => {
            item.remove();
        });
        // Deletes all items in list
    });
    
    favs_button.addEventListener('click', function(event) {
        if (mode === "favs") {
            mode = "search";

            let path_list = run_search(mainFolder);
            addToList(lista, path_list);

            indicador.innerText = "Seleccione un archivo para abrir";
        } else if (mode === "search") {
            mode = "favs";

            let items = Array.from(lista.getElementsByTagName('li'));
            items.forEach(item => {
                item.remove();
            });
            // Deletes all items in list

            input.value = "";

            marcadores = fs.readFileSync(favDir, 'utf8');

            if (marcadores.length) {
                addToList(lista, marcadores.split(";"));
                indicador.innerText = "Select favorite";
            } else {
                indicador.innerText = "No favorites";
            }
        }
    });

    input.addEventListener('keydown', function(event) {

        if (event.keyCode == 13) {
            if (mode == "config") {
                fs.writeFileSync(fileDir, input.value);
                mainFolder = fs.readFileSync(fileDir, 'utf8').replace('\n', '');

                indicador.innerText = "Guardado";

                input.value = "";

                mode = "search";
            } else if (mode == "search") {
                let folderList = input.value;

                if (mainDir.length > 0) {
                    key = input.value;
                    folderList = run_search(mainFolder);
                    correct_files = searcher(folderList, key);
                    addToList(lista, correct_files);
                }
            }
        }
      
    });

    updateItems = function(lista) {
        let items = Array.from(lista.getElementsByTagName("li"));

        items.forEach(item => {
            item.addEventListener('mouseenter', function(event) {
                if (mode == "search") {
                    let favs = fs.readFileSync(favDir, 'utf8');
                    favs = favs.split(';');
                    // Gets favs to compare
                    
                    let item_text = item.getElementsByTagName("p")[0].innerText;

                    let in_item = undefined;

                    if (favs.includes(item_text)) {
                        in_item = add_element(item, "div", {
                            "className": "icon-less"
                        });
                    } else {
                        in_item = add_element(item, "div", {
                            "className": "icon-add"
                        });
                    }
    
                    if (item.getElementsByClassName("icon-add").length)
                        item.getElementsByClassName("icon-add")[0].addEventListener('click', function(event) {
                            add_to_favs(item);
        
                            indicador.innerText = "Agregado a marcadores";
                            in_item.classList.remove("icon-add");
                            in_item.classList.add("icon-less");
                        });

                    if (item.getElementsByClassName("icon-less").length)
                        item.getElementsByClassName("icon-less")[0].addEventListener('click', function(event) {
                            let el_text = item.getElementsByTagName("p")[0].innerText;

                            let content = fs.readFileSync(favDir, 'utf8');
                            content = content.split(';');

                            let index = content.indexOf(el_text);
                            if (index !== -1) content.splice(index, 1);

                            content = content.join(';');
                            fs.writeFileSync(favDir, content);

                            in_item.classList.remove("icon-less");
                            in_item.classList.add("icon-add");
                        });

                } else if (mode == "favs") {
                    let less_item = add_element(item, "div", {
                        "className": "icon-less"
                    });
    
                    less_item.addEventListener('click', function(event) {
                        let el_text = item.getElementsByTagName("p")[0].innerText;

                        let content = fs.readFileSync(favDir, 'utf8');
                        content = content.split(';');

                        let index = content.indexOf(el_text);
                        if (index !== -1) content.splice(index, 1);

                        content = content.join(';');
                        fs.writeFileSync(favDir, content);

                        addToList(lista, content);
                        add_item.classList.remove("icon-less");
                        add_item.classList.add("icon-add");
                    });
                }
            });
            item.addEventListener('mouseleave', function(event) {
                this.innerHTML = "<p>" + this.innerText + "</p>";
            });
            item.getElementsByTagName("p")[0].addEventListener("click", function(event) {
                let dir = mainDir + this.innerText;
                if (fs.lstatSync(dir).isDirectory()) {
                    mainDir = dir + "/";
                    let path_list = run_search(mainDir);
                    addToList(lista, path_list);
                } else {
                    console.log("xdg-open " + dir);
                    exec("xdg-open " + dir);
                    input.value = "";
                }
            });
        });
    }

    addToList = function(main_list, new_list) {
        let items = Array.from(main_list.getElementsByTagName('li'));
        items.forEach(item => {
            item.remove();
        });
        // Deletes all elements in list 

        new_list.unshift(".."); 
    
        for (var i = 0; i < new_list.length; i++) {
            add_element(main_list, "li", {"innerHTML": "<p>" + new_list[i] + "</p>"});
        }

        updateItems(main_list);
    }

    add_to_favs = function(item) {
        content = fs.readFileSync(favDir, 'utf8');
        added_dir = item.getElementsByTagName("p")[0].innerText;
        
        if (content.includes(added_dir)) return;
        // Avoid adding duplicated dirs

        if (content.length == 0) {
            fs.writeFileSync(favDir, added_dir);
        } else {
            fs.writeFileSync(favDir, content + ';' + added_dir);
        }
    }

    indicador.innerText = "Select file to open";
    let path_list = run_search(mainFolder);
    addToList(lista, path_list);
    // Adds firsts elements to list
    
    if (!fs.existsSync(fileDir)) {
        fs.writeFile(fileDir, process.cwd(), function (err) {
            if (err) throw err;
            console.log('fileDir was created successfully');
        });
    }

    if (!fs.existsSync(favDir)) {
        fs.writeFile(favDir, "", function (err) {
            if (err) throw err;
            console.log('favDir was created successfully');
        });
    }
    // Creates files if not exists

    input.focus();
}
