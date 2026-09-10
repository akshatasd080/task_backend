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

const LOGO_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
];

const MAX_LOGO_SIZE = 10 * 1024 * 1024;

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
            return errorResponse(res, "File is too large.", 400);
        }
        return errorResponse(res, err.message, 400);
    }

    if (err) {
        return errorResponse(res, err.message || "File upload failed.", 400);
    }

    return next();
};

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(uploadsRoot, "tmp");
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

const logoUpload = multer({
    storage: logoStorage,
    fileFilter: (req, file, cb) => {
        if (!LOGO_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error("Logo must be a JPG, PNG, GIF, or WEBP image."), false);
        }
        return cb(null, true);
    },
    limits: { fileSize: MAX_LOGO_SIZE },
});

const persistCompanyLogo = (file, companyId) => {
    if (!file?.path) return null;

    const dir = path.join(uploadsRoot, String(companyId));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const ext = path.extname(file.filename || file.originalname) || ".png";
    const filename = `logo-${Date.now()}${ext}`;
    const dest = path.join(dir, filename);
    fs.renameSync(file.path, dest);
    return path.posix.join("uploads", String(companyId), filename);
};

const deleteUploadedFile = (relativeOrAbs) => {
    if (!relativeOrAbs) return;

    const abs = path.isAbsolute(relativeOrAbs)
        ? relativeOrAbs
        : path.join(__dirname, "../..", relativeOrAbs);

    try {
        if (fs.existsSync(abs)) {
            fs.unlinkSync(abs);
        }
    } catch (_) {
        // ignore missing files
    }
};

module.exports = {
    upload,
    logoUpload,
    handleUploadError,
    persistCompanyLogo,
    deleteUploadedFile,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
};
