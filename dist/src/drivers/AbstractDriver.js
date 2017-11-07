"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * AbstractDriver
 */
class AbstractDriver {
    GetDataFromServer(database, server, port, user, password, schema, ssl) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbModel = {};
            yield this.ConnectToServer(database, server, port, user, password, ssl);
            dbModel.entities = yield this.GetAllTables(schema);
            yield this.GetCoulmnsFromEntity(dbModel.entities, schema);
            yield this.GetIndexesFromEntity(dbModel.entities, schema);
            dbModel.entities = yield this.GetRelations(dbModel.entities, schema);
            yield this.DisconnectFromServer();
            this.FindPrimaryColumnsFromIndexes(dbModel);
            return dbModel;
        });
    }
}
exports.AbstractDriver = AbstractDriver;
//# sourceMappingURL=AbstractDriver.js.map