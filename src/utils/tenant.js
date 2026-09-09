/**
 * Resolve tenant company id from authenticated user.
 * SYSTEM_ADMIN may pass company_id via query/body when managing tenants.
 * Company users always use their JWT companyId.
 */
const getCompanyId = (req, { allowQuery = false } = {}) => {
    if (req.user?.userType === "SYSTEM_ADMIN") {
        if (allowQuery) {
            const fromQuery = req.query.company_id || req.body?.company_id;
            if (fromQuery) return Number(fromQuery);
        }
        return null;
    }

    if (!req.user?.companyId) {
        const err = new Error("Company context is missing.");
        err.statusCode = 403;
        throw err;
    }

    return Number(req.user.companyId);
};

/**
 * Ensure a company-scoped resource belongs to the caller's company.
 */
const assertSameCompany = (resourceCompanyId, user) => {
    if (user.userType === "SYSTEM_ADMIN") return true;

    if (Number(resourceCompanyId) !== Number(user.companyId)) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
    }

    return true;
};

const isSystemAdmin = (user) => user?.userType === "SYSTEM_ADMIN";

module.exports = {
    getCompanyId,
    assertSameCompany,
    isSystemAdmin,
};
