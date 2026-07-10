const ApiResponse = require("../../utils/apiResponse");
const AdminService = require("./admin.service");

class AdminController {

    static async login(req, res) {

        try {

            const { email, password } = req.body;

            const admin = await AdminService.login(email, password);

            return ApiResponse.success(
                res,
                "Login Successful",
                admin
            );

        } catch (error) {

            return ApiResponse.error(
                res,
                error.message,
                401
            );

        }

    }

}

module.exports = AdminController;



