"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const plan_routes_1 = __importDefault(require("./plan.routes"));
const favorite_routes_1 = __importDefault(require("./favorite.routes"));
const alert_routes_1 = __importDefault(require("./alert.routes"));
const provider_routes_1 = __importDefault(require("./provider.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/plans', plan_routes_1.default);
router.use('/favorites', favorite_routes_1.default);
router.use('/alerts', alert_routes_1.default);
router.use('/b2b', provider_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map