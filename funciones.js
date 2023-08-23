//const connection = require("./db");
const fs = require("fs");
const path = require("path");

module.exports = {
  col2coma: (txt) => {
    //Me hace las columnas
    array = txt.split("|");
    arraySinBlanco = array.map((dato) => dato.trim());
    return arraySinBlanco.slice(2, arraySinBlanco.length - 1); //Devulve un array con las columnas
  },
  colTxt: (linea) => {
    lineaSep = module.exports.col2coma(linea);
    //Agrego ID
    txt = "ID INT AUTO_INCREMENT PRIMARY KEY,";
    for (let i = 0; i < lineaSep.length; i++) {
      if (i != lineaSep.length - 1) {
        txt += lineaSep[i] + " VARCHAR(75),";
      } else {
        txt += lineaSep[i] + " VARCHAR(75)";
      }
    }
    return txt; //Devuelve un texto con columna tipo de dato
  },
  crearConsultaTabla: (name, coLine) => {
    colsText = module.exports.colTxt(coLine);
    return `CREATE TABLE ${name}(${colsText})`; //Devuelve el texto con el create tabla y sus columnas
  },
  columnaManual: (nameTabla) => {
    fs.readFile("./Tablas SAP/" + tabla + ".txt", "utf-8", (err, data) => {
      if (err) throw err;
      const lines = data.split("\n");
      array = lines[3].split("|");
      arraySinBlanco = array.map((dato) => dato.trim());
      return arraySinBlanco.slice(2, arraySinBlanco.length - 1);
    });
  },
  createInsert: (tabla, columna) => {
    //Creo las columnas de la consulta
    let cols = columna.join(","); //'columna1,columna2...'
    cols += ",ClIENTE,FECHA_CARGA";
    //Obtengo la cantidad de columnas
    let num = columna.length;
    //Hago el array de signo de preguntas
    let arr = Array.from({ length: num }, () => "?");
    let pregs = arr.join(",");
    pregs += ",?,?";
    return `INSERT INTO ${tabla} (${cols}) VALUES (${pregs})`;
  },
  procesarUnArchivo: async (file, listaDeTablas, listaDeColumnas, cliente) => {
    let i = 0;
    let numChunk = 0;
    await new Promise((resolve) => {
      let fileAsync = fs.createReadStream(file.path, { encoding: "utf8" });
      indiceArch = listaDeTablas.indexOf(
        path.parse(file.originalname).name.toUpperCase()
      ); //Obtengo el indice de la columna
      cols = listaDeColumnas[indiceArch]; //Guardo la lista de columnas
      const insert = module.exports.createInsert(
        path.parse(file.originalname).name,
        cols
      );

      //Obtengo la fecha de hoy
      const today = new Date();
      let date = today.toISOString().substring(0, 19).replace("T", " ");

      fileAsync.on("data", async (data) => {
        console.log("Entre", data);
        fileAsync.pause();
        const lines = data.split("\n"); //Separo las lineas del archivo nuevo
        let index = numChunk == 0 ? 5 : 1;
        for (index; index < lines.length; index++) {
          i += 1;
          //Manejo de registro
          registro = lines[index].split("|");
          registroSinBlanco = registro.map((dato) => dato.trim());
          registroNull = registroSinBlanco.map((dato) =>
            dato == "" ? null : dato
          );
          //La cuestión de si hay | de más que rompe todo
          let values = registroNull.slice(2, registroNull.length - 1);
          if (values.length != cols.length) {
            registro = lines[index].split(" |");
            registroSinBlanco = registro.map((dato) => dato.trim());
            registroNull = registroSinBlanco.map((dato) =>
              dato == "" || dato == "|" ? null : dato
            );
            values = registroNull.slice(1, registroNull.length - 1);
          }

          //Agregando cliente y fecha
          if (cliente != "") {
            values.push(cliente);
          } else {
            values.push(null);
          }
          values.push(date);
          if (values.length == cols.length + 2) {
            await new Promise((resolve) => {
              connection.connect((err) => {
                if (err) throw err;
                const queryPromise = new Promise((queryResolve) => {
                  // console.log(i,values);
                  connection.query(insert, values, (error) => {
                    if (error) throw error;
                    queryResolve();
                  });
                });
                queryPromise.then(resolve);
              });
            });
          } else {
            console.log("ERROR", values, i);
            console.log(lines[index]);
            console.log(registroNull);
          }
        }
        numChunk += 1;
        fileAsync.resume();
      });

      fileAsync.on("end", () => {
        //resolve()
      });
    });
  },
  procesarArchivos: async (files, listaDeTablas, listaDeColumnas, cliente) => {
    let tablasSubidas = [];
    for await (const file of files) {
      if (
        listaDeTablas.includes(path.parse(file.originalname).name.toUpperCase())
      ) {
        //Si el nombre del archivo esta en la lista de tablas
        await module.exports.procesarUnArchivo(
          file,
          listaDeTablas,
          listaDeColumnas,
          cliente
        );
        tablasSubidas.push(path.parse(file.originalname).name);
      }
    }
  },
  objectToCsv: (data) => {
    console.log("Llegue a la conversion final");
    const csvRows = [];
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      csvRows.push(headers.join(","));
      for (const row of data) {
        const values = headers.map((header, index) => {
          const value = row[header] != null ?  row[header] .toString() :'';
          const escapedValue = value.replace(/"/g, '\\"');
          const isLast = index === headers.length - 1;
          const modifiedValue = isLast
            ? escapedValue.replace(/\r/g, "")
            : escapedValue;
          return `"${modifiedValue}"`;
        });
        //console.log(values)
        csvRows.push(values.join(","));
      }  
    } 
    return(csvRows.join("\n"));
  },
  obtenerObjField: (arr) => {
    const uniqueElements = [];
    const seenElements = new Set();

    for (const element of arr) {
      const key = `${element.obj}-${element.field}`;

      if (!seenElements.has(key)) {
        seenElements.add(key);
        uniqueElements.push(element);
      }
    }

    return uniqueElements;
  },
  devolverPosObj: (arrObjField, arrObj) => {
    let arrayAdelv = [];
    for (let i = 0; i < arrObjField.length; i++) {
      let arrayPosField = [];
      for (let j = 0; j < arrObj.length; j++) {
        if (
          arrObjField[i].field == arrObj[j].field &&
          arrObjField[i].obj == arrObj[j].obj
        ) {
          arrayPosField.push((j + 1).toString());
        }
      }
      arrayAdelv.push(arrayPosField);
    }
    return arrayAdelv;
  },
  transformarConsulta: (objetos) =>{
    //Vamos a transformar el objeto que se nos devuelve en consultas con le formato {obj:'',field:'',von:''} -> Un array de eso
    let array = []
    objetos.forEach(obj => {
        //Por cada objeto debemos obtener su clave que no es el id
        let claveObj = Object.keys(obj).filter((key)=> key!='id')[0] //Me devuelve el nombre del objeto
        let camposObj =   Object.keys(obj[claveObj]) //Obtengo los campos
        camposObj.forEach(campo => {
          let vonsXcampo = obj[claveObj][campo].von
          for (let i = 0; i < vonsXcampo.length; i++) {
              //X cada valor hago una consulta y la agrego
              let consulta = {obj:claveObj,field:campo,von:vonsXcampo[i]}
              array.push(consulta)
          }
        })
    });
    
    return array
  }
};
