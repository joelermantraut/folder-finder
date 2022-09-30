const fs = require('fs');
const path = require('path');
const exec = require("child_process").exec;
const { ipcRenderer } = require('electron');

// DECLARACIONES

add_element = function (parent, child, properties) {
    /*
    Añade un elemento hijo a un elemento padre
    Le asigna las propiedades en "properties"
    "properties" es un diccionario con las propiedades
    como keys y sus valores como values
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
    Obtiene el objeto "Rect" que devuelve una tupla
    con parametros top,left,right,bottom,x,y,width y height.
    */
    var objRect = element.getBoundingClientRect();
    return objRect;
}

run_search = function(path) {
    if (path == undefined) {
        path = process.cwd();
        // If no path, actual path default
    }

    let needle = 'needle'; // No idea what it does
    let files = undefined;
    try {
        files = fs.readdirSync(path);
    } catch (error) {
        console.log(error);
    }

    return files;
}

buscador = function(filelist, key) {
    new_filelist = [];
    filelist.forEach(file => {
        if (file.includes(key))
            new_filelist.push(file)
    });

    return new_filelist;
}

// FUNCIONES

window.onload = function() {
    const fileDir = path.join(__dirname, '/files/dir.cfg');
    const markDir = path.join(__dirname, '/files/marks.cfg');

    // CONSTANTS

    let indicador = document.getElementsByClassName("search")[0].getElementsByTagName("p")[0];
    let input = document.getElementsByClassName("search")[0].getElementsByTagName("input")[0];
    let lista = document.getElementsByClassName("list")[0];
    let close_button = document.getElementsByClassName("icon-close")[0];
    let config_button = document.getElementsByClassName("icon-config")[0];
    let marks = document.getElementsByClassName("icon-mark")[0];
    
    var markOn = false;
    var folderList = [];
    var busqueda;
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
        // Coloca el nombre de la carpeta principal para poder editarla

        indicador.innerText = "Presiona ENTER para cambiar la carpeta principal"

        let items = Array.from(lista.getElementsByTagName('li'));
        items.forEach(item => {
            item.remove();
        });
        // Elimina todos los items de la lista
    });
    
    marks.addEventListener('click', function(event) {
        if (mode === "marks") {
            mode = "search";

            let path_list = run_search(mainFolder);
            addToList(lista, path_list);

            indicador.innerText = "Seleccione un archivo para abrir";
        } else if (mode === "search") {
            mode = "marks";

            let items = Array.from(lista.getElementsByTagName('li'));
            items.forEach(item => {
                item.remove();
            });
            // Elimina todos los items de la lista

            input.value = "";

            marcadores = fs.readFileSync(markDir, 'utf8');

            if (marcadores.length) {
                addToList(lista, marcadores.split(";"));
                indicador.innerText = "Seleccione un marcador";
            } else {
                indicador.innerText = "No hay marcadores";
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
                    correct_files = buscador(folderList, key)
                    console.log(correct_files)
                    // addToList(lista, folderList);
                }
            }
        }
      
    });

    input.focus();

    updateItems = function(lista) {
        let items = Array.from(lista.getElementsByTagName("li"));

        items.forEach(item => {
            item.addEventListener('mouseenter', function(event) {
                if (mode == "search") {
                    let marks = fs.readFileSync(markDir, 'utf8');
                    marks = marks.split(';');
                    // Gets marks to compare
                    
                    let item_text = item.getElementsByTagName("p")[0].innerText;

                    let in_item = undefined;

                    if (marks.includes(item_text)) {
                        in_item = add_element(item, "div", {
                            "className": "icon-less"
                        });
                    } else {
                        in_item = add_element(item, "div", {
                            "className": "icon-add"
                        });
                    }
    
                    in_item.addEventListener('click', function(event) {
                        content = fs.readFileSync(markDir, 'utf8');
                        added_dir = item.getElementsByTagName("p")[0].innerText;
                        if (content.length == 0) {
                            fs.writeFileSync(markDir, added_dir);
                        } else {
                            fs.writeFileSync(markDir, content + ';' + added_dir);
                        }
    
                        indicador.innerText = "Agregado a marcadores";
                        in_item.classList.remove("icon-add");
                        in_item.classList.add("icon-less");
                    });

                    in_item.addEventListener('click', function(event) {
                        let el_text = item.getElementsByTagName("p")[0].innerText;

                        let content = fs.readFileSync(markDir, 'utf8');
                        content = content.split(';');

                        let index = content.indexOf(el_text);
                        if (index !== -1) content.splice(index, 1);

                        content = content.join(';');
                        fs.writeFileSync(markDir, content);

                        in_item.classList.remove("icon-less");
                        in_item.classList.add("icon-add");
                    });
                } else if (mode == "marks") {
                    let less_item = add_element(item, "div", {
                        "className": "icon-less"
                    });
    
                    less_item.addEventListener('click', function(event) {
                        let el_text = item.getElementsByTagName("p")[0].innerText;

                        let content = fs.readFileSync(markDir, 'utf8');
                        content = content.split(';');

                        let index = content.indexOf(el_text);
                        if (index !== -1) content.splice(index, 1);

                        content = content.join(';');
                        fs.writeFileSync(markDir, content);

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
                if (this.innerText === "..") {
                    // Back to parent
                    mainDir = mainDir.split("/");
                    mainDir.pop();  
                    mainDir = mainDir.join("/") + "/";

                    this.innerText = "";
                }

                let dir = mainDir + this.innerText;
                if (fs.lstatSync(dir).isDirectory()) {
                    mainDir = dir;
                    let path_list = run_search(mainDir);
                    addToList(lista, path_list);
                } else {
                    let dir = mainDir + this.innerText;
                    exec("xdg-open " + dir);
                    input.value = "";

                    console.log("Abrir: " + dir);
                }
            });
        });
    }

    addToList = function(main_list, new_list) {
        new_list.unshift(".."); 

        let items = Array.from(main_list.getElementsByTagName('li'));
        items.forEach(item => {
            item.remove();
        });
        // Elimina todos los items de la lista
    
        for (var i = 0; i < new_list.length; i++) {
            add_element(main_list, "li", {"innerHTML": "<p>" + new_list[i] + "</p>"});
        }

        updateItems(main_list);
    }

    indicador.innerText = "Seleccione un archivo para abrir";
    let path_list = run_search(mainFolder);
    addToList(lista, path_list);
}
