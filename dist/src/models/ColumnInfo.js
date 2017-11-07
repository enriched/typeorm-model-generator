"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ColumnInfo
 */
class ColumnInfo {
    constructor() {
        this.name = '';
        this.default = null;
        this.is_nullable = false;
        this.char_max_lenght = null;
        this.isPrimary = false;
        this.is_generated = false;
        this.numericPrecision = null;
        this.numericScale = null;
        this.relations = [];
    }
}
exports.ColumnInfo = ColumnInfo;
//# sourceMappingURL=ColumnInfo.js.map