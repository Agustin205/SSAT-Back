const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { User, Consult, history, client, Lote } = require("../models");
require("dotenv").config();

const register = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingUser = await User.findOne({
      where: { email: req.body.email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Ya existe un usuario registrado con este correo electrónico.",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await User.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      password: hashedPassword,
      email: req.body.email,
      enabled: true,
    });

    res.status(201).json({ message: "Usuario registrado con éxito." });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Correo electrónico o contraseña incorrectos." });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ message: "Correo electrónico o contraseña incorrectos." });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res
      .status(200)
      .json({ message: "Inicio de sesión exitoso.", token: token });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const addConsult = async (req, res) => {
  try {
    
  } catch (error) {
    console.error("Error en agregar consulta:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
  let userId = req.userId;
  let field = [];
  let object = [];
  let von = [];
  let vot = [];
  let switchs = [];

  const { client, name, data } = req.body;
  if (data) {
    data.map((datos) => {
      field.push(datos.field ? datos.field : "");
      object.push(datos.obj ? datos.obj : "");
      von.push(datos.von ? datos.von : "");
      vot.push(datos.vot ? datos.vot : "");
      switchs.push(datos.switch ? 1 : 0);
    });

    let newConsult = {
      user_id: userId,
      name: name,
      object: object.join(","),
      field: field.join(","),
      von: von.join(","),
      vot: vot.join(","),
      switch: switchs.join(","),
      client: client,
    };

    console.log(newConsult);
    Consult.create(newConsult)
      .then(() => {
        res.status(201).json("Success");
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  }
};

const editConsult = async (req, res) => {
  let userId = req.userId;
  let field = [];
  let object = [];
  let von = [];
  let vot = [];
  let switchs = [];

  const { client, name, data, id } = req.body;
  if (data) {
    data.map((datos) => {
      field.push(datos.field ? datos.field : "");
      object.push(datos.obj ? datos.obj : "");
      von.push(datos.von ? datos.von : "");
      vot.push(datos.vot ? datos.vot : "");
      switchs.push(datos.switch ? 1 : 0);
    });

    let newConsult = {
      user_id: userId,
      name: name,
      object: object.join(","),
      field: field.join(","),
      von: von.join(","),
      vot: vot.join(","),
      switch: switchs.join(","),
      client: client,
    };

    console.log(newConsult);
    Consult.update(newConsult, { where: { id: id } })
      .then(() => {
        res.status(201).json("Success");
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  }
};

const getConsult = async (req, res) => {
  try {
    let userId = req.userId;

  let results = await Consult.findAll({ where: { user_id: userId } });

  const transformedData = {
    data: [],
  };

  for (const obj of results) {
    const objects = obj.object.split(",");
    const fields = obj.field.split(",");
    const vonValues = obj.von.split(",");
    const votValues = obj.vot.split(",");
    const switches = obj.switch.split(",");

    const transformedObj = {
      id: obj.id,
      client: obj.client,
      name: obj.name,
      data: [],
    };

    for (let i = 0; i < objects.length; i++) {
      transformedObj.data.push({
        obj: objects[i],
        field: fields[i],
        von: vonValues[i],
        vot: votValues[i],
        switch: switches[i] === "1",
      });
    }

    transformedData.data.push(transformedObj);
  }

  res.json(transformedData);
  } catch (error) {
    console.error("Error al obtner consulta:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getHistoryConsult = async (req, res) => {
  try {
    let data = [];
  let lotesConsultas = await Lote.findAll({
    where: { fk_client: req.body.cliente },
  });
  let results = [];
  let nombreLote = [];
  for (let i = 0; i < lotesConsultas.length; i++) {
    nombreLote.push(lotesConsultas[i].dataValues.name);
    let arrTemp = await history.findAll({
      where: { lote: lotesConsultas[i].dataValues.id },
      include: [{ model: User, attributes: ["email"] }],
    });
    results.push(arrTemp);
  }

  results.forEach((lote) => {
    let dataXlote = [];
    let i = 1;
    lote.forEach((consulta) => {
      let obj = {};
      obj["date"] = consulta.dataValues.createdAt;
      obj["user"] = consulta.dataValues.User.dataValues.email;
      obj["csv"] = consulta.dataValues.csv;
      let name = "";
      let posSTCODE = consulta.dataValues.object.split(",").indexOf("S_TCODE");
      if (posSTCODE != -1) {
        name = "consulta: " + consulta.dataValues.von.split(",")[posSTCODE];
      } else {
        name = `Consulta: ${i}`;
      }
      obj["name"] = name;
      i++;
      dataXlote.push(obj);
    });
    data.push(dataXlote);
  });
  let objDevolver = { data: data, names: nombreLote }; //[ [ [] ],[ [] ],[ [] ]....]
  res.json(objDevolver);
  } catch (error) {
    console.error("Error al obtener historia:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const updateHistoryConsult = async (req, data, ruta) => {
  //La nueva la tengo que agregar
  try {
    let userId = req.userId;
  let field = [];
  let object = [];
  let von = [];
  let vot = [];
  let switchs = [];
  let lote = req.body.lote;

  if (data) {
    data.map((datos) => {
      field.push(datos.field ? datos.field : "");
      object.push(datos.obj ? datos.obj : "");
      von.push(datos.von ? datos.von : "");
      vot.push("");
      switchs.push(datos.switch ? 1 : 0);
    });

    let newConsult = {
      user_id: userId,
      object: object.join(","),
      field: field.join(","),
      von: von.join(","),
      vot: vot.join(","),
      switch: switchs.join(","),
      csv: ruta,
      lote: lote,
    };

    history.create(newConsult);
  }

  //Despues me fijo si hay más de 5 del mismo lote si las hay la ultima la tengo que borrar
  let results = await history.findAll({ where: { lote: lote } });

  //Si hay mas de 5 eliminamos al mas viejo
  if (results.length >= 5) {
    history.destroy({
      where: {
        id: results[0].dataValues.id,
      },
    });
    fs.unlink("./csvs/" + results[0].dataValues.csv, (err) => {
      if (err) {
        console.error("Error al eliminar el archivo:", err);
      } else {
        console.log("El archivo ha sido eliminado correctamente.");
      }
    });
  }
  } catch (error) {
    console.error("Error al actualizar historia:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const devolverCsc = async (req, res) => {
  try {
    let ruta = req.body.route;
  fs.readFile("./csvs/" + ruta, "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo CSV:", err);
      return res.status(500).send("Error al leer el archivo CSV");
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=archivo.csv");
    res.send(data);
  });
  } catch (error) {
    console.error("Error al devolver csv:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const addClient = async (req, res) => {
  try {
  let obj = {};
  obj["name"] = req.body.client;
  client.create(obj);
  res.send(200);
  } catch (error) {
    console.error("Error al agregar cliente:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getClient = async (req, res) => {
  try {
    let data = [];
  let results = await client.findAll();

  results.forEach((element) => {
    let obj = {};
    obj["name"] = element.dataValues.name;
    obj["id"] = element.dataValues.id_client;
    data.push(obj);
  });
  let objDevolver = { data: data };
  res.json(objDevolver);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const deleteClient = async (req, res) => {
  const clientId = req.params.id; // Utiliza req.params en lugar de req.body
  try {
    await client.destroy({
      where: {
        id_client: clientId,
      },
    });

    res.status(200).json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el cliente" });
  }
};

const addLote = async (req, res) => {
  try {
    let obj = {};
  obj["name"] = req.body.name;
  obj["fk_client"] = req.body.client;
  const newLote = await Lote.create(obj);
  res.json(newLote);
  } catch (error) {
    console.error("Error al agregar lote:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getLote = async (req, res) => {
  try {
    let data = [];
  let results = await Lote.findAll({ where: { fk_client: req.body.clientId } });

  results.forEach((element) => {
    let obj = {};
    obj["name"] = element.dataValues.name;
    obj["id"] = element.dataValues.id;
    data.push(obj);
  });
  let objDevolver = { data: data };
  res.json(objDevolver);
  } catch (error) {
    console.error("Error al obtener lote:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports = {
  register,
  login,
  addConsult,
  editConsult,
  getConsult,
  getHistoryConsult,
  updateHistoryConsult,
  devolverCsc,
  addClient,
  getClient,
  deleteClient,
  addLote,
  getLote,
};
