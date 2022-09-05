const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const electron = require('electron');
const {shell} = require('electron');
const { config } = require('process');
const { connect } = require('http2');
const ipcRenderer = electron.ipcRenderer;

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

buscador = function(filelist) {
    files = fs.readdirSync(__dirname + "/files/");
    filelist = filelist || [];

    files.forEach(function(file) {
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            if (file == busqueda) {
                filelist.push(path.join(dir, file));
            }
            filelist = buscador(dir + '/' + file, filelist);
        }
    });
    return filelist;
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
    
    // ELEMENTS

    close_button.addEventListener('click', function(event) {
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
    });

    input.addEventListener('keydown', function(event) {

        if (event.keyCode == 13) {
            if (mode == "config") {
                fs.writeFileSync(fileDir, input.value);

                indicador.innerText = "Guardado";

                input.value = "";

                mode = "search";
            } else {
                let folderList = input.value;

                if (mainFolder.length > 0) {
                    busqueda = input.value;
                    folderList = buscador(mainFolder, folderList);
                    addToList(lista, folderList);
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
                    let add_item = add_element(item, "div", {
                        "className": "icon-add"
                    });
    
                    add_item.addEventListener('click', function(event) {
                        content = fs.readFileSync(markDir, 'utf8');
                        added_dir = item.getElementsByTagName("p")[0].innerText;
                        if (content.length == 0) {
                            fs.writeFileSync(markDir, added_dir);
                        } else {
                            fs.writeFileSync(markDir, content + ';' + added_dir);
                        }
    
                        indicador.innerText = "Agregado a marcadores";
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
                    });
                }
            });
            item.addEventListener('mouseleave', function(event) {
                this.innerHTML = "<p>" + this.innerText + "</p>";
            });
            item.getElementsByTagName("p")[0].addEventListener("click", function(event) {
                // shell.openItem(this.innerText);
                console.log("Abrir: " + this.innerText);
                input.value = "";
            });
        });
    }

    addToList = function(main_list, new_list) {
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

    addToList(lista, ["Elemento 1", "Elemento 2", "Elemento 3"]);
}

/*

$indicador.on('click', function(event) {
    dir = $input.val();
    fs.writeFileSync(fileDir, dir);
    $(this).slideUp('slow');
    $input.val('');
});
*/
