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
const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
/**
 * Engine
 */
class Engine {
    constructor(driver, Options) {
        this.driver = driver;
        this.Options = Options;
    }
    createModelFromDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let dbModel = yield this.getEntitiesInfo(this.Options.databaseName, this.Options.host, this.Options.port, this.Options.user, this.Options.password, this.Options.schemaName, this.Options.ssl);
            if (dbModel.entities.length > 0) {
                this.createModelFromMetadata(dbModel);
            }
            else {
                console.error('Tables not found in selected database. Skipping creation of typeorm model.');
            }
            return true;
        });
    }
    getEntitiesInfo(database, server, port, user, password, schemaName, ssl) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.driver.GetDataFromServer(database, server, port, user, password, schemaName, ssl);
        });
    }
    createModelFromMetadata(databaseModel) {
        let templatePath = path.resolve(__dirname, '../../src/entity.mst');
        let template = fs.readFileSync(templatePath, 'UTF-8');
        let resultPath = this.Options.resultsPath;
        if (!fs.existsSync(resultPath))
            fs.mkdirSync(resultPath);
        this.createTsConfigFile(resultPath);
        this.createTypeOrm(resultPath);
        let entitesPath = path.resolve(resultPath, './entities');
        Handlebars.registerHelper('toLowerCase', function (str) {
            return str.toLowerCase();
        });
        if (!fs.existsSync(entitesPath))
            fs.mkdirSync(entitesPath);
        let compliedTemplate = Handlebars.compile(template, { noEscape: true });
        databaseModel.entities.forEach(element => {
            let resultFilePath = path.resolve(entitesPath, element.EntityName + '.ts');
            let rendered = compliedTemplate(element);
            fs.writeFileSync(resultFilePath, rendered, { encoding: 'UTF-8', flag: 'w' });
        });
    }
    createTsConfigFile(resultPath) {
        fs.writeFileSync(path.resolve(resultPath, 'tsconfig.json'), `{"compilerOptions": {
        "lib": ["es5", "es6"],
        "target": "es6",
        "module": "commonjs",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "sourceMap": true
    }}`, { encoding: 'UTF-8', flag: 'w' });
    }
    createTypeOrm(resultPath) {
        fs.writeFileSync(path.resolve(resultPath, 'ormconfig.json'), `[
  {
    "name": "default",
    "driver": {
      "type": "${this.Options.databaseType}",
      "host": "${this.Options.host}",
      "port": ${this.Options.port},
      "username": "${this.Options.user}",
      "password": "${this.Options.password}",
      "database": "${this.Options.databaseName}"
    },
    "entities": [
      "entities/*.js"
    ]
  }
]`, { encoding: 'UTF-8', flag: 'w' });
    }
}
exports.Engine = Engine;
//# sourceMappingURL=Engine.js.map