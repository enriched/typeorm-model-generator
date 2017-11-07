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
require('dotenv').config();
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const fs = require("fs-extra");
const path = require("path");
const Engine_1 = require("./../../src/Engine");
const MssqlDriver_1 = require("./../../src/drivers/MssqlDriver");
const chai_1 = require("chai");
const EntityFileToJson_1 = require("../utils/EntityFileToJson");
var chai = require('chai');
var chaiSubset = require('chai-subset');
const ts = require("typescript");
const PostgresDriver_1 = require("../../src/drivers/PostgresDriver");
const MysqlDriver_1 = require("../../src/drivers/MysqlDriver");
const MariaDbDriver_1 = require("../../src/drivers/MariaDbDriver");
const yn = require("yn");
chai.use(chaiSubset);
describe("integration tests", function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.timeout(20000);
        this.slow(5000); //compiling created models takes time
        let examplesPathJS = path.resolve(process.cwd(), 'dist/test/integration/examples');
        let examplesPathTS = path.resolve(process.cwd(), 'test/integration/examples');
        let files = fs.readdirSync(examplesPathTS);
        let dbDrivers = [];
        if (process.env.POSTGRES_Skip == '0')
            dbDrivers.push('postgres');
        if (process.env.MYSQL_Skip == '0')
            dbDrivers.push('mysql');
        if (process.env.MARIADB_Skip == '0')
            dbDrivers.push('mariadb');
        if (process.env.MSSQL_Skip == '0')
            dbDrivers.push('mssql');
        for (let folder of files) {
            describe(folder, function () {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let dbDriver of dbDrivers) {
                        it(dbDriver, function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                let filesOrgPathJS = path.resolve(examplesPathJS, folder, 'entity');
                                let filesOrgPathTS = path.resolve(examplesPathTS, folder, 'entity');
                                let resultsPath = path.resolve(process.cwd(), `output`);
                                fs.removeSync(resultsPath);
                                let engine;
                                switch (dbDriver) {
                                    case 'mssql':
                                        engine = yield createMSSQLModels(filesOrgPathJS, resultsPath);
                                        break;
                                    case 'postgres':
                                        engine = yield createPostgresModels(filesOrgPathJS, resultsPath);
                                        break;
                                    case 'mysql':
                                        engine = yield createMysqlModels(filesOrgPathJS, resultsPath);
                                        break;
                                    case 'mariadb':
                                        engine = yield createMariaDBModels(filesOrgPathJS, resultsPath);
                                        break;
                                    default:
                                        console.log(`Unknown engine type`);
                                        engine = {};
                                        break;
                                }
                                let result = yield engine.createModelFromDatabase();
                                let filesGenPath = path.resolve(resultsPath, 'entities');
                                let filesOrg = fs.readdirSync(filesOrgPathTS).filter(function (val, ind, arr) { return val.toString().endsWith('.ts'); });
                                let filesGen = fs.readdirSync(filesGenPath).filter(function (val, ind, arr) { return val.toString().endsWith('.ts'); });
                                chai_1.expect(filesOrg, 'Errors detected in model comparision').to.be.deep.equal(filesGen);
                                for (let file of filesOrg) {
                                    let entftj = new EntityFileToJson_1.EntityFileToJson();
                                    let jsonEntityOrg = entftj.convert(fs.readFileSync(path.resolve(filesOrgPathTS, file)));
                                    let jsonEntityGen = entftj.convert(fs.readFileSync(path.resolve(filesGenPath, file)));
                                    chai_1.expect(jsonEntityGen, `Error in file ${file}`).to.containSubset(jsonEntityOrg);
                                }
                                const currentDirectoryFiles = fs.readdirSync(filesGenPath).
                                    filter(fileName => fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".ts").map(v => {
                                    return path.resolve(filesGenPath, v);
                                });
                                let compileErrors = compileTsFiles(currentDirectoryFiles, {
                                    experimentalDecorators: true,
                                    sourceMap: false,
                                    emitDecoratorMetadata: true,
                                    target: ts.ScriptTarget.ES2016,
                                    moduleResolution: ts.ModuleResolutionKind.NodeJs,
                                    module: ts.ModuleKind.CommonJS
                                });
                                chai_1.expect(compileErrors, 'Errors detected while compiling generated model').to.be.false;
                            });
                        });
                    }
                });
            });
        }
    });
});
function createMSSQLModels(filesOrgPath, resultsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let driver;
        driver = new MssqlDriver_1.MssqlDriver();
        yield driver.ConnectToServer(`master`, String(process.env.MSSQL_Host), Number(process.env.MSSQL_Port), String(process.env.MSSQL_Username), String(process.env.MSSQL_Password), yn(process.env.MSSQL_SSL));
        if (!(yield driver.CheckIfDBExists(String(process.env.MSSQL_Database))))
            yield driver.CreateDB(String(process.env.MSSQL_Database));
        yield driver.DisconnectFromServer();
        let connOpt = {
            database: String(process.env.MSSQL_Database),
            host: String(process.env.MSSQL_Host),
            password: String(process.env.MSSQL_Password),
            type: 'mssql',
            username: String(process.env.MSSQL_Username),
            port: Number(process.env.MSSQL_Port),
            dropSchema: true,
            synchronize: true,
            entities: [path.resolve(filesOrgPath, '*.js')],
        };
        let conn = yield typeorm_1.createConnection(connOpt);
        if (conn.isConnected)
            yield conn.close();
        driver = new MssqlDriver_1.MssqlDriver();
        let engine = new Engine_1.Engine(driver, {
            host: String(process.env.MSSQL_Host),
            port: Number(process.env.MSSQL_Port),
            databaseName: String(process.env.MSSQL_Database),
            user: String(process.env.MSSQL_Username),
            password: String(process.env.MSSQL_Password),
            databaseType: 'mssql',
            resultsPath: resultsPath,
            schemaName: 'dbo',
            ssl: yn(process.env.MSSQL_SSL)
        });
        return engine;
    });
}
function createPostgresModels(filesOrgPath, resultsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let driver;
        driver = new PostgresDriver_1.PostgresDriver();
        yield driver.ConnectToServer(`postgres`, String(process.env.POSTGRES_Host), Number(process.env.POSTGRES_Port), String(process.env.POSTGRES_Username), String(process.env.POSTGRES_Password), yn(process.env.POSTGRES_SSL));
        if (!(yield driver.CheckIfDBExists(String(process.env.POSTGRES_Database))))
            yield driver.CreateDB(String(process.env.POSTGRES_Database));
        yield driver.DisconnectFromServer();
        let connOpt = {
            database: String(process.env.POSTGRES_Database),
            host: String(process.env.POSTGRES_Host),
            password: String(process.env.POSTGRES_Password),
            type: 'postgres',
            username: String(process.env.POSTGRES_Username),
            port: Number(process.env.POSTGRES_Port),
            dropSchema: true,
            synchronize: true,
            entities: [path.resolve(filesOrgPath, '*.js')],
        };
        let conn = yield typeorm_1.createConnection(connOpt);
        if (conn.isConnected)
            yield conn.close();
        driver = new PostgresDriver_1.PostgresDriver();
        let engine = new Engine_1.Engine(driver, {
            host: String(process.env.POSTGRES_Host),
            port: Number(process.env.POSTGRES_Port),
            databaseName: String(process.env.POSTGRES_Database),
            user: String(process.env.POSTGRES_Username),
            password: String(process.env.POSTGRES_Password),
            databaseType: 'postgres',
            resultsPath: resultsPath,
            schemaName: 'public',
            ssl: yn(process.env.POSTGRES_SSL)
        });
        return engine;
    });
}
function createMysqlModels(filesOrgPath, resultsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let driver;
        driver = new MysqlDriver_1.MysqlDriver();
        yield driver.ConnectToServer(`mysql`, String(process.env.MYSQL_Host), Number(process.env.MYSQL_Port), String(process.env.MYSQL_Username), String(process.env.MYSQL_Password), yn(process.env.MYSQL_SSL));
        if (!(yield driver.CheckIfDBExists(String(process.env.MYSQL_Database))))
            yield driver.CreateDB(String(process.env.MYSQL_Database));
        yield driver.DisconnectFromServer();
        let connOpt = {
            database: String(process.env.MYSQL_Database),
            host: String(process.env.MYSQL_Host),
            password: String(process.env.MYSQL_Password),
            type: 'mysql',
            username: String(process.env.MYSQL_Username),
            port: Number(process.env.MYSQL_Port),
            dropSchema: true,
            synchronize: true,
            entities: [path.resolve(filesOrgPath, '*.js')],
        };
        let conn = yield typeorm_1.createConnection(connOpt);
        if (conn.isConnected)
            yield conn.close();
        driver = new MysqlDriver_1.MysqlDriver();
        let engine = new Engine_1.Engine(driver, {
            host: String(process.env.MYSQL_Host),
            port: Number(process.env.MYSQL_Port),
            databaseName: String(process.env.MYSQL_Database),
            user: String(process.env.MYSQL_Username),
            password: String(process.env.MYSQL_Password),
            databaseType: 'mysql',
            resultsPath: resultsPath,
            schemaName: 'ignored',
            ssl: yn(process.env.MYSQL_SSL)
        });
        return engine;
    });
}
function createMariaDBModels(filesOrgPath, resultsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let driver;
        driver = new MariaDbDriver_1.MariaDbDriver();
        yield driver.ConnectToServer(`mysql`, String(process.env.MARIADB_Host), Number(process.env.MARIADB_Port), String(process.env.MARIADB_Username), String(process.env.MARIADB_Password), yn(process.env.MARIADB_SSL));
        if (!(yield driver.CheckIfDBExists(String(process.env.MARIADB_Database))))
            yield driver.CreateDB(String(process.env.MARIADB_Database));
        yield driver.DisconnectFromServer();
        let connOpt = {
            database: String(process.env.MARIADB_Database),
            host: String(process.env.MARIADB_Host),
            password: String(process.env.MARIADB_Password),
            type: 'mariadb',
            username: String(process.env.MARIADB_Username),
            port: Number(process.env.MARIADB_Port),
            dropSchema: true,
            synchronize: true,
            entities: [path.resolve(filesOrgPath, '*.js')],
        };
        let conn = yield typeorm_1.createConnection(connOpt);
        if (conn.isConnected)
            yield conn.close();
        driver = new MariaDbDriver_1.MariaDbDriver();
        let engine = new Engine_1.Engine(driver, {
            host: String(process.env.MARIADB_Host),
            port: Number(process.env.MARIADB_Port),
            databaseName: String(process.env.MARIADB_Database),
            user: String(process.env.MARIADB_Username),
            password: String(process.env.MARIADB_Password),
            databaseType: 'mariadb',
            resultsPath: resultsPath,
            schemaName: 'ignored',
            ssl: yn(process.env.MARIADB_SSL)
        });
        return engine;
    });
}
function compileTsFiles(fileNames, options) {
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit();
    let compileErrors = false;
    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    allDiagnostics.forEach(diagnostic => {
        let lineAndCharacter = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        console.log(`${diagnostic.file.fileName} (${lineAndCharacter.line + 1},${lineAndCharacter.character + 1}): ${message}`);
        compileErrors = true;
    });
    return compileErrors;
}
//# sourceMappingURL=integration.test.js.map