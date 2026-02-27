"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = getPagination;
function getPagination(req, defaultLimit = 20) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || defaultLimit);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
//# sourceMappingURL=pagination.js.map