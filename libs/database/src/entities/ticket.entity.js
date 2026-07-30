"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
let TicketEntity = class TicketEntity extends base_entity_1.BaseEntity {
    tenantId;
    conversationId;
    status;
    reason;
    assignedTo;
    priority;
    metadata;
    resolvedAt;
};
exports.TicketEntity = TicketEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], TicketEntity.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_id' }),
    __metadata("design:type", String)
], TicketEntity.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'open' }),
    __metadata("design:type", String)
], TicketEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketEntity.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'assigned_to' }),
    __metadata("design:type", String)
], TicketEntity.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketEntity.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TicketEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'resolved_at' }),
    __metadata("design:type", Date)
], TicketEntity.prototype, "resolvedAt", void 0);
exports.TicketEntity = TicketEntity = __decorate([
    (0, typeorm_1.Entity)('tickets')
], TicketEntity);
//# sourceMappingURL=ticket.entity.js.map