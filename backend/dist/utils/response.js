"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
exports.noContent = noContent;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.conflict = conflict;
exports.serverError = serverError;
function ok(res, data, meta) {
    return res.json({ success: true, data, ...(meta && { meta }) });
}
function created(res, data) {
    return res.status(201).json({ success: true, data });
}
function noContent(res) {
    return res.status(204).send();
}
function badRequest(res, error) {
    return res.status(400).json({ success: false, error });
}
function unauthorized(res, error = 'Não autorizado') {
    return res.status(401).json({ success: false, error });
}
function forbidden(res, error = 'Acesso negado') {
    return res.status(403).json({ success: false, error });
}
function notFound(res, error = 'Não encontrado') {
    return res.status(404).json({ success: false, error });
}
function conflict(res, error) {
    return res.status(409).json({ success: false, error });
}
function serverError(res, error = 'Erro interno do servidor') {
    return res.status(500).json({ success: false, error });
}
//# sourceMappingURL=response.js.map