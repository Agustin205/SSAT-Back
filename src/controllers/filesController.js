const path = require("path");
const session = require("express-session");
const { Console } = require("console");
const Papa = require("papaparse");
const connection = require("./../database/db");
const fs = require("fs");
const funciones = require("./../../funciones");
const userController = require('./userController')
const { v4: uuidv4 } = require('uuid');

const fileController = {
  index: (req, res) => {
    let val = false;
    let tablas = [];

    if (req.session.data != undefined) {
      tablas = req.session.data.tablas;
    }
    if (tablas != undefined) {
      if (tablas.length != 0) {
        val = true;
      }
    } else {
      tablas = [];
    }
    //res.status(200).json({ validacion: val, tab: tablas });
    return res.render("index", { validacion: val, tab: tablas });
  },
  transaction: (req, res) => {
    query = `SELECT NAME FROM usobt_c where type='TR' group by (NAME);`;
    connection.query(query, (err, result) => {
      if (err) throw err;
      let lista = []
      result.forEach(resu => {
        lista.push(resu.NAME)
      });
      res.json({
        list: lista
      });
    });
  },
  transactionObj: (req, res) => {
    valueTrans = Object.keys(req.body);
    query = `SELECT OBJECT, FIELD FROM ssat.usobt_c where Name = ? group by OBJECT, Field;`;
    connection.query(query, valueTrans, (err, result) => {
      if (err) throw err;
      let lista = result.map(res => {
        res['VON'] = []
        res['CHECK'] = true
        res['switch'] = false
        return res
      }) 
      lista.push({ OBJECT: "S_TCODE", FIELD: "TCD", VON:valueTrans, CHECK:true,switch:false });
      res.json(lista);
    });
  },
  objSearch: (req, res) => {

    let array = funciones.transformarConsulta(req.body.data)
  
    //Despues la proceso
    let query = "";
    let arrayValues = [];
    let userBlockFilter = req.body.blockUsers ? "and g.UFLAG = 0":""
    let validDate = '30/06/2023'
    let userValidityDate = req.body.userValidityDate ?  `and STR_TO_DATE(g.GLTGV, '%d.%m.%Y') < STR_TO_DATE('${validDate}', '%d/%m/%Y') and  STR_TO_DATE('${validDate}', '%d/%m/%Y') < STR_TO_DATE(g.GLTGB, '%d.%m.%Y')`:""
    let excludePower = req.body.powerProfiles ? "and a.AUTH != '&_SAP_ALL'" : ""
    if (array.length > 1) {
      for (let i = 0; i < array.length; i++) {
        let obj = array[i].obj;
        let field = array[i].field;
        let von = array[i].von;
        //let vot = array[i].vot;
        let sentVon = von === "*" ? "" : " and (a.VON = ?  or a.VON = '*')";
        if (von != "*") {
          arrayValues.push(obj, field, von, obj, field, von);
        } else {
          arrayValues.push(obj, field, obj, field);
        }
        if (i == 0) {
          query = `SELECT a.OBJCT objeto, a.FIELD campo, a.VON valorDesde, a.BIS valorHasta, a.AUTH autorizacion, c.agr_name rol, c.PROFILE perfil, d.bname username, f.name_first nombre, f.name_last apellido, g.ERDAT, g.TRDAT, g.UFLAG, g.GLTGV, g.GLTGB, g.USTYP FROM ust12 AS a INNER JOIN ust10s AS b ON a.AUTH = b.AUTH AND a.OBJCT = b.OBJCT INNER JOIN agr_prof AS c ON b.PROFN = c.PROFILE INNER JOIN ust04 AS d ON b.PROFN = d.PROFILE INNER JOIN usr21 AS e ON d.BNAME = e.BNAME INNER JOIN adrp AS f ON e.PERSNUMBER = f.PERSNUMBER INNER JOIN usr02 AS g ON d.BNAME = g.BNAME LEFT JOIN ust10c AS test ON b.profn = test.subprof WHERE a.OBJCT = ? AND a.FIELD = ?  ${sentVon} ${userBlockFilter} ${userValidityDate} ${excludePower} AND a.ID_LOTE = ${req.body.lote} AND b.ID_LOTE = ${req.body.lote} AND c.ID_LOTE = ${req.body.lote} AND d.ID_LOTE = ${req.body.lote} AND e.ID_LOTE = ${req.body.lote} AND f.ID_LOTE = ${req.body.lote} AND g.ID_LOTE = ${req.body.lote} UNION SELECT a.OBJCT objeto, a.FIELD campo, a.VON valorDesde, a.BIS valorHasta, a.AUTH autorizacion, NULL, test.profn, d.bname username, f.name_first nombre, f.name_last apellido, g.ERDAT, g.TRDAT, g.UFLAG, g.GLTGV, g.GLTGB, g.USTYP FROM ust12 AS a INNER JOIN ust10s AS b ON a.AUTH = b.AUTH INNER JOIN ust10c AS test ON b.profn = test.subprof INNER JOIN ust04 AS d ON test.PROFN = d.PROFILE INNER JOIN usr21 AS e ON d.BNAME = e.BNAME INNER JOIN adrp AS f ON e.PERSNUMBER = f.PERSNUMBER INNER JOIN usr02 AS g ON d.BNAME = g.BNAME WHERE a.OBJCT = ? AND a.FIELD = ?  ${sentVon} ${userBlockFilter} ${userValidityDate} ${excludePower} AND a.ID_LOTE = ${req.body.lote} AND b.ID_LOTE = ${req.body.lote} AND d.ID_LOTE = ${req.body.lote} AND e.ID_LOTE = ${req.body.lote} AND f.ID_LOTE = ${req.body.lote} AND g.ID_LOTE = ${req.body.lote}  `;
        } else {
          query += `UNION SELECT a.OBJCT objeto, a.FIELD campo, a.VON valorDesde, a.BIS valorHasta, a.AUTH autorizacion, c.agr_name rol, c.PROFILE perfil, d.bname username, f.name_first nombre, f.name_last apellido, g.ERDAT, g.TRDAT, g.UFLAG, g.GLTGV, g.GLTGB, g.USTYP FROM ust12 AS a INNER JOIN ust10s AS b ON a.AUTH = b.AUTH AND a.OBJCT = b.OBJCT INNER JOIN agr_prof AS c ON b.PROFN = c.PROFILE INNER JOIN ust04 AS d ON b.PROFN = d.PROFILE INNER JOIN usr21 AS e ON d.BNAME = e.BNAME INNER JOIN adrp AS f ON e.PERSNUMBER = f.PERSNUMBER INNER JOIN usr02 AS g ON d.BNAME = g.BNAME LEFT JOIN ust10c AS test ON b.profn = test.subprof WHERE a.OBJCT = ? AND a.FIELD = ?  ${sentVon} ${userBlockFilter} ${userValidityDate} ${excludePower} AND a.ID_LOTE = ${req.body.lote} AND b.ID_LOTE = ${req.body.lote} AND c.ID_LOTE = ${req.body.lote} AND d.ID_LOTE = ${req.body.lote} AND e.ID_LOTE = ${req.body.lote} AND f.ID_LOTE = ${req.body.lote} AND g.ID_LOTE = ${req.body.lote}  UNION SELECT a.OBJCT objeto, a.FIELD campo, a.VON valorDesde, a.BIS valorHasta, a.AUTH autorizacion, NULL, test.profn, d.bname username, f.name_first nombre, f.name_last apellido, g.ERDAT, g.TRDAT, g.UFLAG, g.GLTGV, g.GLTGB, g.USTYP FROM ust12 AS a INNER JOIN ust10s AS b ON a.AUTH = b.AUTH INNER JOIN ust10c AS test ON b.profn = test.subprof INNER JOIN ust04 AS d ON test.PROFN = d.PROFILE INNER JOIN usr21 AS e ON d.BNAME = e.BNAME INNER JOIN adrp AS f ON e.PERSNUMBER = f.PERSNUMBER INNER JOIN usr02 AS g ON d.BNAME = g.BNAME WHERE a.OBJCT = ? AND a.FIELD = ?  ${sentVon} ${userBlockFilter} ${userValidityDate} ${excludePower} AND a.ID_LOTE = ${req.body.lote} AND b.ID_LOTE = ${req.body.lote} AND d.ID_LOTE = ${req.body.lote} AND e.ID_LOTE = ${req.body.lote} AND f.ID_LOTE = ${req.body.lote} AND g.ID_LOTE = ${req.body.lote}  `;
        }
      }
    } else {
      let obj = array[0].obj;
      let field = array[0].field;
      let von = array[0].von;
      //let vot = array[0].vot;
      let sentVon = von === "*" ? "" : " and (a.VON = ?  or a.VON = '*')";
      if (von != "*") {
        arrayValues.push(obj, field, von, obj, field, von);
      } else {
        arrayValues.push(obj, field, obj, field);
      }
      query = `SELECT a.OBJCT objeto, a.FIELD campo, a.VON valorDesde, a.BIS valorHasta, a.AUTH autorizacion, c.agr_name rol, c.PROFILE perfil, d.bname username,
			f.name_first nombre, f.name_last apellido, g.ERDAT, g.TRDAT, g.UFLAG, g.GLTGV, g.GLTGB, g.USTYP
		FROM ust12 AS a
		INNER JOIN ust10s AS b ON a.AUTH = b.AUTH AND a.OBJCT = b.OBJCT
		INNER JOIN agr_prof AS c ON b.PROFN = c.PROFILE
		INNER JOIN ust04 AS d ON b.PROFN = d.PROFILE
		INNER JOIN usr21 AS e ON d.BNAME = e.BNAME
		INNER JOIN adrp AS f ON e.PERSNUMBER = f.PERSNUMBER
		INNER JOIN usr02 AS g ON d.BNAME = g.BNAME
		LEFT JOIN ust10c AS test ON b.profn = test.subprof
		WHERE a.OBJCT = ? AND a.FIELD = ? ${sentVon} ${userBlockFilter} ${userValidityDate} ${excludePower} AND a.ID_LOTE = ${req.body.lote} AND b.ID_LOTE = ${req.body.lote} AND c.ID_LOTE = ${req.body.lote} AND d.ID_LOTE = ${req.body.lote} AND e.ID_LOTE = ${req.body.lote} AND f.ID_LOTE = ${req.body.lote} AND g.ID_LOTE = ${req.body.lote} 
		
		UNION
		
		SELECT a.OBJCT objeto, a.FIELD campo, a.VON valorDesde, a.BIS valorHasta, a.AUTH autorizacion, NULL, test.profn, d.bname username,
			f.name_first nombre, f.name_last apellido, g.ERDAT, g.TRDAT, g.UFLAG, g.GLTGV, g.GLTGB, g.USTYP
		FROM ust12 AS a
		INNER JOIN ust10s AS b ON a.AUTH = b.AUTH 
		INNER JOIN ust10c AS test ON b.profn = test.subprof
		INNER JOIN ust04 AS d ON test.PROFN = d.PROFILE
		INNER JOIN usr21 AS e ON d.BNAME = e.BNAME
		INNER JOIN adrp AS f ON e.PERSNUMBER = f.PERSNUMBER
		INNER JOIN usr02 AS g ON d.BNAME = g.BNAME
			WHERE a.OBJCT = ? AND a.FIELD = ?  ${sentVon} ${userBlockFilter} ${userValidityDate} ${excludePower} AND a.ID_LOTE = ${req.body.lote} AND b.ID_LOTE = ${req.body.lote} AND d.ID_LOTE = ${req.body.lote} AND e.ID_LOTE = ${req.body.lote} AND f.ID_LOTE = ${req.body.lote} AND g.ID_LOTE = ${req.body.lote} `;
    }
    connection.query(query, arrayValues, (err, result) => {
      if (err) throw err;

      // Enviar la respuesta en formato JSON
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=resultados.csv`
      );
      //Hago un array con cada uno de los registros que devuelve (cada uno de esos es solo un array con los valores) -> Me facilita el laburo
      let lines = result.map((res) =>Object.values(res).map((val) => {
          let valMod = val;
          if (val === null) {
            valMod = "";
          }
          return valMod;
        })
      );
      
      let objAut = array.reduce((obj, { obj: objeto, field }) => {
        if (obj[objeto]) {
          if (!obj[objeto].includes(field)) {
            obj[objeto].push(field);
          }
        } else {
          obj[objeto] = [field];
        }
        return obj;
      }, {}); //{obj1:[field1,field2]} Esto sirve para el tema de sumatoria de autoriciones x objeto.

      //Hago un objeto literal que tenga x cada consulta un array vacio (ahi le voy a ir cargando los usuarios)
      let usauriosXconsulta = {};
      array.forEach((element, i) => {
        usauriosXconsulta[i + 1] = [];
      });

      //Tanto los * o si usa un or debo ignorar los von y con tener un registros por obj-field basta (no neceit)
      let consultaSinVon = [];
      req.body.data.forEach(element => {
        let {id,...nElement} = element
        let obj = Object.keys(nElement)[0]
        let fields = Object.keys(nElement[obj])
        for (let i = 0; i < fields.length; i++) {
          let consSub = {}
          consSub['obj'] = obj
          consSub['field'] = fields[i]
          consultaSinVon.push(consSub)
        }
      });

      //Me encargo de los generales con *
      let usuariosXestrella = {};

      consultaSinVon.forEach((element, i) => {
        usuariosXestrella[i + 1] = [];
      });

      ///Aca empieza lo chido
      let usuariosVerdaderos = [];

      //Agrego a los usuarios x objeto -> Recorro las lineas
      lines.forEach((currentLine) => {
        let primerosTresElementos = currentLine.slice(0, 3); // Obtener los primeros tres elementos del array, es decir obj,field,von

        //Busco la posición del array de objetos que se encuentra y para ver donde tengo que meter el usuario.
        let cons = "";

        //Si el registro tiene como VON:* lo laburo de otra forma
        if (primerosTresElementos[2] != "*") {
          cons = array.find((elemento) => {
            let values = Object.values(elemento); //Agarro una lista de constulta con formato: [obj,field,value]
            let verif =
              primerosTresElementos[0] == values[0] &&
              primerosTresElementos[1] == values[1] &&
              primerosTresElementos[2] == values[2]
                ? true
                : false;
            return verif;
          });
          //Si es undefined significa que no la encontro esto solo pasa si hay una * en von. Por lo tanto ese lo tenemos que buscar de otra forma. Es decir comparamos los primeros dos elementos.
          if (cons == undefined) {
            cons = array.find((elemento) => {
              let values = Object.values(elemento); //Agarro una lista de constulta con formato: [obj,field,value]
              let verif =
                primerosTresElementos[0] == values[0] &&
                primerosTresElementos[1] == values[1]
                  ? true
                  : false;
              return verif;
            });
          }
          let posicionFinal = array.indexOf(cons) + 1; //Agarro la posicion de la lista de objetos
          if (posicionFinal != 0) {
            let array = usauriosXconsulta[posicionFinal]; //Obtengo los rdos que ya estaban el lista
            array.push(currentLine[7]); //Guardo el usuario
            usauriosXconsulta[posicionFinal] = array; //Actualizo el array
          }
        } else {
          consEstrella = consultaSinVon.find((elemento) => {
            let values = Object.values(elemento); //Agarro una lista de constulta con formato: [obj,field,value]
            let verif =
              primerosTresElementos[0] == values[0] &&
              primerosTresElementos[1] == values[1]
                ? true
                : false;
            return verif;
          });
          let posicionFinal = consultaSinVon.indexOf(consEstrella) + 1; //Agarro la posicion de la lista de objetos
          if (posicionFinal != 0) {
            let array = usuariosXestrella[posicionFinal]; //Obtengo los rdos que ya estaban el lista
            array.push(currentLine[7]); //Guardo el usuario
            usuariosXestrella[posicionFinal] = array; //Actualizo el array
          }
        }

      });

      //Filtro los usuarios -> Chekeo que todos tengan acceso a las consultas requeridas.
      //Cambia dependiendo si debo considerar los Von como AND o no.

      let superArray = [] //Este array va a tener una lista por c/u de de los obj-field-von o obj-field dependiendo el switch
     
      req.body.data.forEach((element) =>{
        let {id,...nElement} = element
        let obj = Object.keys(nElement)[0]
        let fields = Object.keys(nElement[obj])
        fields.forEach((field) => {
          //Por cada obj-campo se puede desear un AND entre los valores o un switch. 
          let vonAnd = nElement[obj][field].switch
          if(vonAnd){
            //Tengo que obtener en que lugar de usauriosXconsulta/estrella esta el obj-campo-von que queremos
            let vons = nElement[obj][field].von
            //Primero para los usuarios no *
            vons.forEach((von) => {
              let posArray = array.findIndex((consulta)=> consulta.obj === obj && consulta.field === field && consulta.von === von)
              superArray.push(usauriosXconsulta[posArray+1].filter((elemento, indice) => usauriosXconsulta[posArray+1].indexOf(elemento) === indice))
            })
            //Ahora usuarios * -> X cada consulta agrego los maestros
            let posArrayEstrella = consultaSinVon.findIndex((consulta)=> consulta.obj === obj && consulta.field === field)
            for (let i = 0; i < vons.length; i++) {
              let pos = superArray.length - vons.length + i 
              superArray[pos] = superArray[pos].concat(usuariosXestrella[posArrayEstrella+1].filter((elemento, indice) => usuariosXestrella[posArrayEstrella+1].indexOf(elemento) === indice))
            }
          } else {
             //Voy a recorrer los vons y obtener los registros, la diferencia es que los voy a concatenar en un mismo array y despues lo guardo como uno
             let vons = nElement[obj][field].von
             let arrayGeneral = []
             //Primero para los usuarios no *
             vons.forEach((von) => {
               let posArray = array.findIndex((consulta)=> consulta.obj === obj && consulta.field === field && consulta.von === von)
               arrayGeneral.push(usauriosXconsulta[posArray+1].filter((elemento, indice) => usauriosXconsulta[posArray+1].indexOf(elemento) === indice))
             })
             //Ahora usuarios * -> X cada consulta agrego los maestros
            let posArrayEstrella = consultaSinVon.findIndex((consulta)=> consulta.obj === obj && consulta.field === field)
            arrayGeneral.push(usuariosXestrella[posArrayEstrella+1].filter((elemento, indice) => usuariosXestrella[posArrayEstrella+1].indexOf(elemento) === indice))
            arrayGeneral = arrayGeneral.flat().filter((elemento, indice) => arrayGeneral.flat().indexOf(elemento) === indice)
            superArray.push(arrayGeneral)
          }
        })
      })

      //Recorremos el array
      for (let i = 0; i < superArray[0].length; i++) {
        let verif = true;
        let j=1
        //Me fijo si los usuarios de un objeto estan en el resto. Recorro el resto
        while (verif && j < Object.keys(superArray).length) {
            if(!superArray[j].includes(superArray[0][i])) {
              verif = false;
            }
            j++;
        }
        //Si estan y además no se incluyo antes, se incluye (xq puede ser que el usuario se repita en usuariosXobj)
        if(verif && !usuariosVerdaderos.includes(superArray[0][i])){
          usuariosVerdaderos.push(superArray[0][i])
        }
      }

      let objCompleto = [];

      //Por cada usuario me guardo los resgistros que me sirven (con toda la data en un array, sueltos)
      for (let index = 0; index < result.length; index++) {
          if (usuariosVerdaderos.includes(result[index].username)) {
            objCompleto.push(result[index]);
          }
      }

      let registrosFinales = [];
      //chinoBasico02 -> Autorizacion
  	  //Recorro  los usuario verdaderos
      for (var i = 0; i < usuariosVerdaderos.length; i++) {
        let registrosXusuarios = objCompleto.filter((registro) => usuariosVerdaderos[i] === registro.username); //X cada usuario obtengo sus registros 
        const objetos = Object.keys(objAut); // [objeto1,objeto2]
        let objCampo = [];
        let verif = true;
        let k = 0;
        while (verif && k < objetos.length) {
          const objeto = objetos[k]; //clave
          //Si el objeto tiene + de un campo
          if (objAut[objeto].length > 1) {
            let autCamp = []; //Creo un array q x cada campo tenga un array con las autorizaciones que hay.
            for (let j = 0; j < objAut[objeto].length; j++) {
              let listaAut = registrosXusuarios.filter((registro) => registro.objeto == objeto && registro.campo == objAut[objeto][j]).map((registroFiltrado) => registroFiltrado.autorizacion);
              listaAut = listaAut.filter((valor, indice, arreglo) => arreglo.indexOf(valor) === indice);
              autCamp.push(listaAut); //quiero agregarle una lista de autoriraciones para el campo j del objetoAut
            }
            let authFinales = [] //Va a tener todas las autorizaciones correpondientes que se repiten en los distintos fields
            for (let r = 0; r < autCamp[0].length;r++){//recorro todas las autorizaciones y me fijo las repetidas (muy parecido a lo que hacemos con usuariosVerdaderos) 
              let existe = true;
              let w = 1
              while (existe && w < autCamp.length) {
                  if(!autCamp[w].includes(autCamp[0][r])) {
                    existe = false;
                  }
                  w++;
              }
              //Si estan y además no se incluyo antes, se incluye la autorizacion
              if(existe && !authFinales.includes(autCamp[0][r])){
                authFinales.push(autCamp[0][r])
              }
            }
            let arrayAsubir = registrosXusuarios.filter((registro) => authFinales.includes(registro.autorizacion) == true && registro.objeto == objeto)
            if (arrayAsubir.length == 0) {
              verif = false;
              break;
            }
            objCampo.push(arrayAsubir); //Lo subo
          } else {
            let arrayAsubir = registrosXusuarios.filter( (registro) =>registro.objeto == objeto && registro.campo == objAut[objeto][0]);
            if (arrayAsubir.length == 0) {
              verif = false;
              break;
            }
            objCampo.push(arrayAsubir);
          }
		
          objCampo = objCampo.reduce((acum, val) => acum.concat(val), []).filter((valor, indice, arreglo) => arreglo.indexOf(valor) === indice);
          k++;
        }
        if (verif) {
          registrosFinales.push(objCampo); //Pongo los objetos
        }
        objCampo = [];
      }
      
      //Anido y concateno todos los registros que estaban de [[.],[.]] -> [.,.] 
      registrosFinales = registrosFinales.reduce((acum, val) => acum.concat(val),[]); 
  	  
      //Lo paso para armar el csv
      let csv = funciones.objectToCsv(registrosFinales);
      let nombreUnico = `${uuidv4()}`;
      //Lo guardo
      fs.writeFile(`./csvs/${nombreUnico}.csv`, csv,(err) =>{
        if (err) {
          console.error('Error al guardar el archivo:', err);
        } else {
          console.log('El archivo se ha guardado correctamente.');
          userController.updateHistoryConsult(req,array,`${nombreUnico}.csv`)
        }
      })

      //Lo envio
      res.send(csv)
    });
  },
};

module.exports = fileController;

