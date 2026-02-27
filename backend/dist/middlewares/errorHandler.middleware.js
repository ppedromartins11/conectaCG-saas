"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
function errorHandler(err, req, res, _next) {
    logger_1.logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
    return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        ...(env_1.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}
function notFoundHandler(req, res) {
    return res.status(404).json({ success: false, error: `Rota ${req.path} não encontrada` });
}
//# sourceMappingURL=errorHandler.middleware.js.map