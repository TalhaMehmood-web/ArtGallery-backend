import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../../public/temp"));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + "-" + file.originalname;
        cb(null, name);
    }
});

// Configure Multer for handling multiple files
export const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }
})
