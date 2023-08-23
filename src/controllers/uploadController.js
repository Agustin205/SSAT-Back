const multer = require("multer");
// Configuración de Multer
const uploadDestination = "public/TABLAS_SAP";
const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    // Mantener el nombre de archivo original
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

module.exports = {
  uploadMiddleware: upload.array("files", 20)
};