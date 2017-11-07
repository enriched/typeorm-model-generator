"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * EntityInfo
 */
class EntityInfo {
    relationImports() {
        var returnString = "";
        var imports = [];
        this.Columns.forEach((column) => {
            column.relations.forEach((relation) => {
                if (this.EntityName != relation.relatedTable)
                    imports.push(relation.relatedTable);
            });
        });
        imports.filter(function (elem, index, self) {
            return index == self.indexOf(elem);
        }).forEach((imp) => {
            returnString += `import {${imp}} from './${imp}'\n`;
        });
        return returnString;
    }
}
exports.EntityInfo = EntityInfo;
//# sourceMappingURL=EntityInfo.js.map