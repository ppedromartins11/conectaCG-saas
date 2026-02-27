"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            const error = result.error.errors[0];
            return res.status(400).json({
                success: false,
                error: `${error.path.join('.')}: ${error.message}`,
            });
        }
        req[source] = result.data;
        return next();
    };
}
//# sourceMappingURL=validate.middleware.js.map