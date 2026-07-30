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
exports.KnowledgeChunkEntity = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const knowledge_source_entity_1 = require("./knowledge-source.entity");
let KnowledgeChunkEntity = class KnowledgeChunkEntity extends base_entity_1.BaseEntity {
    tenantId;
    sourceId;
    content;
    embedding;
    chunkIndex;
    metadata;
    source;
};
exports.KnowledgeChunkEntity = KnowledgeChunkEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], KnowledgeChunkEntity.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_id' }),
    __metadata("design:type", String)
], KnowledgeChunkEntity.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], KnowledgeChunkEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'vector', nullable: true, name: 'embedding' }),
    __metadata("design:type", String)
], KnowledgeChunkEntity.prototype, "embedding", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chunk_index' }),
    __metadata("design:type", Number)
], KnowledgeChunkEntity.prototype, "chunkIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KnowledgeChunkEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => knowledge_source_entity_1.KnowledgeSourceEntity, (source) => source.chunks),
    (0, typeorm_1.JoinColumn)({ name: 'source_id' }),
    __metadata("design:type", knowledge_source_entity_1.KnowledgeSourceEntity)
], KnowledgeChunkEntity.prototype, "source", void 0);
exports.KnowledgeChunkEntity = KnowledgeChunkEntity = __decorate([
    (0, typeorm_1.Entity)('knowledge_chunks'),
    (0, typeorm_1.Index)('idx_knowledge_chunks_tenant', ['tenantId'])
], KnowledgeChunkEntity);
//# sourceMappingURL=knowledge-chunk.entity.js.map