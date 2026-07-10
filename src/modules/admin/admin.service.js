const bcrypt = require("bcrypt");
const AdminModel = require("./admin.model");

class AdminService {

    static async login(email, password) {

        // Find Admin
        const admin = await AdminModel.findByEmail(email);

        if (!admin) {
            throw new Error("Invalid Email or Password");
        }

        // Check Active Status
        if (!admin.is_active) {
            throw new Error("Account is inactive");
        }

        // Compare Password
        const isPasswordValid = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordValid) {
            throw new Error("Invalid Email or Password");
        }

        return admin;
    }

}

module.exports = AdminService;