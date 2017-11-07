"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DatabaseModel {
    relationImports() {
        let that = this;
        return function (text, render) {
            if ('l' != render(text))
                return `import {${render(text)}} from "./${render(text)}"`;
            else
                return '';
        };
    }
}
exports.DatabaseModel = DatabaseModel;
//# sourceMappingURL=DatabaseModel.js.map