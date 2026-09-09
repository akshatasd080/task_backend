const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { errorResponse } = require("../utils/response");

const uploadsRoot = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const companyId = req.user?.companyId || "system";
        const dir = path.join(uploadsRoot, String(companyId));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error("File type not allowed."), false);
    }
    return cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return errorResponse(res, "File size exceeds 10MB limit.", 400);
        }
        return errorResponse(res, err.message, 400);
    }

    if (err) {
        return errorResponse(res, err.message || "File upload failed.", 400);
    }

    return next();
};

module.exports = {
    upload,
    handleUploadError,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
};
