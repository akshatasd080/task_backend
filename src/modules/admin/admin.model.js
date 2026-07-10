const pool = require("../../config/db");

class AdminModel {

    static async findByEmail(email) {

        const query = `
            SELECT *
            FROM task_management.system_admins
            WHERE email = $1
            LIMIT 1
        `;

        const result = await pool.query(query, [email]);

        return result.rows[0];
    }

}

module.exports = AdminModel;