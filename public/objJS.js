
let add = document.getElementsByClassName("addContainer")
let listaCondiciones = []
let json = document.getElementsByName('json')[0];
let ul = document.getElementsByClassName('containerCondciones')[0]
let id = 1
function click() {
    //Si toca el boton add agarro los valores de los campos y los guardo en un objeto literal
    let obj = document.getElementsByName('obj')[0].value;
    let field = document.getElementsByName('field')[0].value;
    let von = document.getElementsByName('von')[0].value;
    let vot = document.getElementsByName('vot')[0].value;
    let objeto = {
        obj:obj,
        field:field,
        von:von,
        vot:vot
    }
    //como puede tener muchas condiciones meto el objeto literal en el array
    listaCondiciones.push(objeto);
    //Luego como quiero insertar ese valor en un campo oculto (que es el que despues leo) transforomo el array a JSON y lo cargo en el campo
    json.value = JSON.stringify(listaCondiciones);
    //Reinicio los campos
    document.getElementsByName('obj')[0].value = ''
    document.getElementsByName('field')[0].value = ''
    document.getElementsByName('von')[0].value = ''
    document.getElementsByName('vot')[0].value = ''
    //Agrego la lista de archivos
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(`${obj}-${field}-${von}-${vot}`));
    li.setAttribute('id', id);
    li.className = "condicion"
    ul.appendChild(li);
    listaID.push(id)
    id += 1
  }

  function borrar (event) {
    // Verifica si el objetivo del clic es un li
      if (event.target.tagName === "LI") {
        // Elimina el li específico que se hizo clic
        let idLi = parseInt(event.target.id)
        listaCondiciones.splice(idLi-1,1)
        event.target.remove();
        //Actualizo el campo sin el li
        json.value = JSON.stringify(listaCondiciones);
      }
  }

add[0].addEventListener('click', click);
ul.addEventListener('click', borrar);
  