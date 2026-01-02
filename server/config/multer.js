// import multer from "multer";

// export const upload = multer({
//     storage: multer.diskStorage({}),
// });

// import multer from "multer";
// import path from "path";

// // Create uploads folder if not exists
// import fs from "fs";
// const dir = "./uploads";
// if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `${Date.now()}-${file.fieldname}${ext}`);
//   },
// });

// export const upload = multer({ storage });

import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb("Images only!");
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
