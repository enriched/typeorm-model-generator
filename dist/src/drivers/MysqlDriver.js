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
const AbstractDriver_1 = require("./AbstractDriver");
const MYSQL = require("mysql");
const ColumnInfo_1 = require("./../models/ColumnInfo");
const EntityInfo_1 = require("./../models/EntityInfo");
const RelationInfo_1 = require("./../models/RelationInfo");
/**
 * MysqlDriver
 */
class MysqlDriver extends AbstractDriver_1.AbstractDriver {
    FindPrimaryColumnsFromIndexes(dbModel) {
        dbModel.entities.forEach(entity => {
            let primaryIndex = entity.Indexes.find(v => v.isPrimaryKey);
            if (!primaryIndex) {
                console.error(`Table ${entity.EntityName} has no PK.`);
                return;
            }
            entity.Columns.forEach(col => {
                if (primaryIndex.columns.some(cIndex => cIndex.name == col.name))
                    col.isPrimary = true;
            });
        });
    }
    GetAllTables(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.ExecQuery(`SELECT TABLE_SCHEMA, TABLE_NAME
            FROM information_schema.tables
            WHERE table_type='BASE TABLE'
            AND table_schema like DATABASE()`);
            let ret = [];
            response.forEach((val) => {
                let ent = new EntityInfo_1.EntityInfo();
                ent.EntityName = val.TABLE_NAME;
                ent.Columns = [];
                ent.Indexes = [];
                ret.push(ent);
            });
            return ret;
        });
    }
    GetCoulmnsFromEntity(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.ExecQuery(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
            DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
            CASE WHEN EXTRA like '%auto_increment%' THEN 1 ELSE 0 END IsIdentity  FROM INFORMATION_SCHEMA.COLUMNS
             where TABLE_SCHEMA like DATABASE()`);
            entities.forEach((ent) => {
                response.filter((filterVal) => {
                    return filterVal.TABLE_NAME == ent.EntityName;
                }).forEach((resp) => {
                    let colInfo = new ColumnInfo_1.ColumnInfo();
                    colInfo.name = resp.COLUMN_NAME;
                    colInfo.is_nullable = resp.IS_NULLABLE == 'YES' ? true : false;
                    colInfo.is_generated = resp.IsIdentity == 1 ? true : false;
                    colInfo.default = resp.COLUMN_DEFAULT;
                    switch (resp.DATA_TYPE) {
                        case "int":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "int";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "tinyint":
                            if (resp.NUMERIC_PRECISION == 3) {
                                colInfo.ts_type = "boolean";
                                colInfo.sql_type = "boolean";
                            }
                            else {
                                colInfo.ts_type = "number";
                                colInfo.sql_type = "smallint";
                                colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            }
                            break;
                        case "smallint":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "smallint";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "bit":
                            colInfo.ts_type = "boolean";
                            colInfo.sql_type = "boolean";
                            break;
                        case "float":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "float";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "bigint":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "bigint";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "date":
                            colInfo.ts_type = "Date";
                            colInfo.sql_type = "date";
                            break;
                        case "time":
                            colInfo.ts_type = "Date";
                            colInfo.sql_type = "time";
                            break;
                        case "datetime":
                            colInfo.ts_type = "Date";
                            colInfo.sql_type = "datetime";
                            break;
                        case "char":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "text";
                            break;
                        case "nchar":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "text";
                            break;
                        case "text":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "text";
                            break;
                        case "ntext":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "text";
                            break;
                        case "varchar":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "varchar";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "nvarchar":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "nvarchar";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "money":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "decimal";
                            break;
                        case "real":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "double";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "double":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "double";
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "decimal":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "decimal";
                            colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                            colInfo.numericScale = resp.NUMERIC_SCALE;
                            colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                            break;
                        case "xml":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "text";
                            break;
                        default:
                            console.error("Unknown column type:" + resp.DATA_TYPE);
                            break;
                    }
                    if (colInfo.sql_type)
                        ent.Columns.push(colInfo);
                });
            });
            return entities;
        });
    }
    GetIndexesFromEntity(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.ExecQuery(`SELECT TABLE_NAME TableName,INDEX_NAME IndexName,COLUMN_NAME ColumnName,CASE WHEN NON_UNIQUE=0 THEN 1 ELSE 0 END is_unique, 
            CASE WHEN INDEX_NAME='PRIMARY' THEN 1 ELSE 0 END is_primary_key
            FROM information_schema.statistics sta
            WHERE table_schema like DATABASE();
            `);
            entities.forEach((ent) => {
                response.filter((filterVal) => {
                    return filterVal.TableName == ent.EntityName;
                }).forEach((resp) => {
                    let indexInfo = {};
                    let indexColumnInfo = {};
                    if (ent.Indexes.filter((filterVal) => {
                        return filterVal.name == resp.IndexName;
                    }).length > 0) {
                        indexInfo = ent.Indexes.filter((filterVal) => {
                            return filterVal.name == resp.IndexName;
                        })[0];
                    }
                    else {
                        indexInfo.columns = [];
                        indexInfo.name = resp.IndexName;
                        indexInfo.isUnique = resp.is_unique == 1 ? true : false;
                        indexInfo.isPrimaryKey = resp.is_primary_key == 1 ? true : false;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.ColumnName;
                    //  indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                    //  indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
                    indexInfo.columns.push(indexColumnInfo);
                });
            });
            return entities;
        });
    }
    GetRelations(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.ExecQuery(`SELECT 
            CU.TABLE_NAME TableWithForeignKey,   
            CU.ORDINAL_POSITION FK_PartNo,
            CU.COLUMN_NAME ForeignKeyColumn, 
            CU.REFERENCED_TABLE_NAME TableReferenced,  
            CU.REFERENCED_COLUMN_NAME ForeignKeyColumnReferenced,
            RC.DELETE_RULE onDelete,
            RC.UPDATE_RULE onUpdate,
            CU.CONSTRAINT_NAME object_id
           FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU
           JOIN 
            INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC ON CU.CONSTRAINT_NAME=RC.CONSTRAINT_NAME
          WHERE
            TABLE_SCHEMA = SCHEMA()       
            AND CU.REFERENCED_TABLE_NAME IS NOT NULL; 
            `);
            let relationsTemp = [];
            response.forEach((resp) => {
                let rels = relationsTemp.find((val) => {
                    return val.object_id == resp.object_id;
                });
                if (rels == undefined) {
                    rels = {};
                    rels.ownerColumnsNames = [];
                    rels.referencedColumnsNames = [];
                    rels.actionOnDelete = resp.onDelete;
                    rels.actionOnUpdate = resp.onUpdate;
                    rels.object_id = resp.object_id;
                    rels.ownerTable = resp.TableWithForeignKey;
                    rels.referencedTable = resp.TableReferenced;
                    relationsTemp.push(rels);
                }
                rels.ownerColumnsNames.push(resp.ForeignKeyColumn);
                rels.referencedColumnsNames.push(resp.ForeignKeyColumnReferenced);
            });
            relationsTemp.forEach((relationTmp) => {
                let ownerEntity = entities.find((entitity) => {
                    return entitity.EntityName == relationTmp.ownerTable;
                });
                if (!ownerEntity) {
                    console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.ownerTable}.`);
                    return;
                }
                let referencedEntity = entities.find((entitity) => {
                    return entitity.EntityName == relationTmp.referencedTable;
                });
                if (!referencedEntity) {
                    console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.referencedTable}.`);
                    return;
                }
                let ownerColumn = ownerEntity.Columns.find((column) => {
                    return column.name == relationTmp.ownerColumnsNames[0];
                });
                if (!ownerColumn) {
                    console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.ownerTable}.${ownerColumn}.`);
                    return;
                }
                let relatedColumn = referencedEntity.Columns.find((column) => {
                    return column.name == relationTmp.referencedColumnsNames[0];
                });
                if (!relatedColumn) {
                    console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.referencedTable}.${relatedColumn}.`);
                    return;
                }
                let ownColumn = ownerColumn;
                let isOneToMany;
                isOneToMany = false;
                let index = ownerEntity.Indexes.find((index) => {
                    return index.isUnique && index.columns.some(col => {
                        return col.name == ownerColumn.name;
                    });
                });
                if (!index) {
                    isOneToMany = true;
                }
                else {
                    isOneToMany = false;
                }
                let ownerRelation = new RelationInfo_1.RelationInfo();
                ownerRelation.actionOnDelete = relationTmp.actionOnDelete;
                ownerRelation.actionOnUpdate = relationTmp.actionOnUpdate;
                ownerRelation.isOwner = true;
                ownerRelation.relatedColumn = relatedColumn.name.toLowerCase();
                ownerRelation.relatedTable = relationTmp.referencedTable;
                ownerRelation.ownerTable = relationTmp.ownerTable;
                ownerRelation.ownerColumn = ownerEntity.EntityName.toLowerCase() + (isOneToMany ? 's' : '');
                ownerRelation.relationType = isOneToMany ? "ManyToOne" : "OneToOne";
                ownerColumn.relations.push(ownerRelation);
                if (isOneToMany) {
                    let col = new ColumnInfo_1.ColumnInfo();
                    col.name = ownerEntity.EntityName.toLowerCase() + 's';
                    let referencedRelation = new RelationInfo_1.RelationInfo();
                    col.relations.push(referencedRelation);
                    referencedRelation.actionOnDelete = relationTmp.actionOnDelete;
                    referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate;
                    referencedRelation.isOwner = false;
                    referencedRelation.relatedColumn = ownerColumn.name;
                    referencedRelation.relatedTable = relationTmp.ownerTable;
                    referencedRelation.ownerTable = relationTmp.referencedTable;
                    referencedRelation.ownerColumn = relatedColumn.name.toLowerCase();
                    referencedRelation.relationType = "OneToMany";
                    referencedEntity.Columns.push(col);
                }
                else {
                    let col = new ColumnInfo_1.ColumnInfo();
                    col.name = ownerEntity.EntityName.toLowerCase();
                    let referencedRelation = new RelationInfo_1.RelationInfo();
                    col.relations.push(referencedRelation);
                    referencedRelation.actionOnDelete = relationTmp.actionOnDelete;
                    referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate;
                    referencedRelation.isOwner = false;
                    referencedRelation.relatedColumn = ownerColumn.name;
                    referencedRelation.relatedTable = relationTmp.ownerTable;
                    referencedRelation.ownerTable = relationTmp.referencedTable;
                    referencedRelation.ownerColumn = relatedColumn.name.toLowerCase();
                    referencedRelation.relationType = "OneToOne";
                    referencedEntity.Columns.push(col);
                }
            });
            return entities;
        });
    }
    DisconnectFromServer() {
        return __awaiter(this, void 0, void 0, function* () {
            let promise = new Promise((resolve, reject) => {
                this.Connection.end((err) => {
                    if (!err) {
                        //Connection successfull
                        resolve(true);
                    }
                    else {
                        console.error('Error disconnecting to MYSQL Server.');
                        console.error(err.message);
                        process.abort();
                        reject(err);
                    }
                });
            });
            if (this.Connection)
                yield promise;
        });
    }
    ConnectToServer(database, server, port, user, password, ssl) {
        return __awaiter(this, void 0, void 0, function* () {
            let config;
            if (ssl) {
                config = {
                    database: database,
                    host: server,
                    port: port,
                    user: user,
                    password: password,
                    ssl: {
                        rejectUnauthorized: false
                    }
                };
            }
            else {
                config = {
                    database: database,
                    host: server,
                    port: port,
                    user: user,
                    password: password
                };
            }
            let promise = new Promise((resolve, reject) => {
                this.Connection = MYSQL.createConnection(config);
                this.Connection.connect((err) => {
                    if (!err) {
                        //Connection successfull
                        resolve(true);
                    }
                    else {
                        console.error('Error connecting to MYSQL Server.');
                        console.error(err.message);
                        process.abort();
                        reject(err);
                    }
                });
            });
            yield promise;
        });
    }
    CreateDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.ExecQuery(`CREATE DATABASE ${dbName}; `);
        });
    }
    UseDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.ExecQuery(`USE ${dbName}; `);
        });
    }
    DropDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.ExecQuery(`DROP DATABASE ${dbName}; `);
        });
    }
    CheckIfDBExists(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.ExecQuery(`SHOW DATABASES LIKE '${dbName}' `);
            return resp.length > 0;
        });
    }
    ExecQuery(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = [];
            let that = this;
            let query = this.Connection.query(sql);
            let stream = query.stream({});
            let promise = new Promise((resolve, reject) => {
                stream.on('data', chunk => {
                    ret.push(chunk);
                });
                stream.on('end', () => resolve(true));
            });
            yield promise;
            return ret;
        });
    }
}
exports.MysqlDriver = MysqlDriver;
//# sourceMappingURL=MysqlDriver.js.map