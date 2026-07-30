"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.generateId = generateId;
const crypto_1 = require("crypto");
function generateApiKey(prefix = 'kb') {
    const key = (0, crypto_1.randomBytes)(32).toString('hex');
    return `${prefix}_${key}`;
}
function hashApiKey(apiKey) {
    return (0, crypto_1.createHash)('sha256').update(apiKey).digest('hex');
}
function generateId() {
    return (0, crypto_1.randomBytes)(16).toString('hex');
}
//# sourceMappingURL=crypto.util.js.map