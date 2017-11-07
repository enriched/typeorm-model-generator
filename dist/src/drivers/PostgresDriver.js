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
const PG = require("pg");
const ColumnInfo_1 = require("./../models/ColumnInfo");
const EntityInfo_1 = require("./../models/EntityInfo");
const RelationInfo_1 = require("./../models/RelationInfo");
/**
 * PostgresDriver
 */
class PostgresDriver extends AbstractDriver_1.AbstractDriver {
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
            let response = (yield this.Connection.query(`SELECT table_schema,table_name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND table_schema = '${schema}' `)).rows;
            let ret = [];
            response.forEach((val) => {
                let ent = new EntityInfo_1.EntityInfo();
                ent.EntityName = val.table_name;
                ent.Columns = [];
                ent.Indexes = [];
                ret.push(ent);
            });
            return ret;
        });
    }
    GetCoulmnsFromEntity(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = (yield this.Connection.query(`SELECT table_name,column_name,column_default,is_nullable,
            data_type,character_maximum_length,numeric_precision,numeric_scale
            --,COLUMNPROPERTY(object_id(table_name), column_name, 'isidentity') isidentity
           , case when column_default LIKE 'nextval%' then 'YES' else 'NO' end isidentity
            FROM INFORMATION_SCHEMA.COLUMNS where table_schema ='${schema}'`)).rows;
            entities.forEach((ent) => {
                response.filter((filterVal) => {
                    return filterVal.table_name == ent.EntityName;
                }).forEach((resp) => {
                    let colInfo = new ColumnInfo_1.ColumnInfo();
                    colInfo.name = resp.column_name;
                    colInfo.is_nullable = resp.is_nullable == 'YES' ? true : false;
                    colInfo.is_generated = resp.isidentity == 'YES' ? true : false;
                    colInfo.default = colInfo.is_generated ? '' : resp.column_default;
                    switch (resp.data_type) {
                        //TODO:change types to postgres
                        case "integer":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "int";
                            colInfo.char_max_lenght = resp.character_maximum_length > 0 ? resp.character_maximum_length : null;
                            break;
                        case "character varying":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "character varying";
                            colInfo.char_max_lenght = resp.character_maximum_length > 0 ? resp.character_maximum_length : null;
                            break;
                        case "text":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "text";
                            break;
                        case "uuid":
                            colInfo.ts_type = "string";
                            colInfo.sql_type = "uuid";
                            break;
                        case "smallint":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "smallint";
                            colInfo.char_max_lenght = resp.character_maximum_length > 0 ? resp.character_maximum_length : null;
                            break;
                        case "bigint":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "bigint";
                            colInfo.char_max_lenght = resp.character_maximum_length > 0 ? resp.character_maximum_length : null;
                            break;
                        case "date":
                            colInfo.ts_type = "Date";
                            colInfo.sql_type = "date";
                            break;
                        case "boolean":
                            colInfo.ts_type = "boolean";
                            colInfo.sql_type = "boolean";
                            break;
                        case "double precision":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "double";
                            colInfo.char_max_lenght = resp.character_maximum_length > 0 ? resp.character_maximum_length : null;
                            break;
                        case "real":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "float";
                            colInfo.char_max_lenght = resp.character_maximum_length > 0 ? resp.character_maximum_length : null;
                            break;
                        case "numeric":
                            colInfo.ts_type = "number";
                            colInfo.sql_type = "decimal";
                            colInfo.char_max_lenght = resp.character_maximum_length > 0 ? resp.character_maximum_length : null;
                            break;
                        case "time without time zone":
                            colInfo.ts_type = "Date";
                            colInfo.sql_type = "time";
                            break;
                        case "timestamp without time zone":
                            colInfo.ts_type = "Date";
                            colInfo.sql_type = "datetime";
                            break;
                        case "timestamp with time zone":
                            colInfo.ts_type = "Date";
                            colInfo.sql_type = "timestamp";
                            break;
                        case "json":
                            colInfo.ts_type = "any";
                            colInfo.sql_type = "json";
                            break;
                        case "jsonb":
                            colInfo.ts_type = "any";
                            colInfo.sql_type = "jsonb";
                            break;
                        // case "boolean":
                        //     colInfo.ts_type = "boolean"
                        //     colInfo.sql_type = "boolean"
                        //     break;
                        default:
                            console.error("Unknown column type:" + resp.data_type);
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
            let response = (yield this.Connection.query(`SELECT
            c.relname AS tablename,
            i.relname as indexname,
            f.attname AS columnname,
            CASE
                WHEN ix.indisunique = true THEN '1'
                ELSE '0'
            END AS is_unique,
            CASE
                WHEN p.contype = 'p' THEN '1'
                ELSE '0'
            END AS is_primary_key
            FROM pg_attribute f
            JOIN pg_class c ON c.oid = f.attrelid
            JOIN pg_type t ON t.oid = f.atttypid
            LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = f.attnum
            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_constraint p ON p.conrelid = c.oid AND f.attnum = ANY (p.conkey)
            LEFT JOIN pg_class AS g ON p.confrelid = g.oid
            LEFT JOIN pg_index AS ix ON f.attnum = ANY(ix.indkey) and c.oid = f.attrelid and c.oid = ix.indrelid
            LEFT JOIN pg_class AS i ON ix.indexrelid = i.oid

            WHERE c.relkind = 'r'::char
            AND n.nspname = '${schema}'
            --AND c.relname = 'nodes'  -- Replace with table name, or Comment this for get all tables
            AND f.attnum > 0
            AND i.oid<>0
            ORDER BY c.relname,f.attname;`)).rows;
            entities.forEach((ent) => {
                response.filter((filterVal) => {
                    return filterVal.tablename == ent.EntityName;
                }).forEach((resp) => {
                    let indexInfo = {};
                    let indexColumnInfo = {};
                    if (ent.Indexes.filter((filterVal) => {
                        return filterVal.name == resp.indexname;
                    }).length > 0) {
                        indexInfo = ent.Indexes.filter((filterVal) => {
                            return filterVal.name == resp.indexname;
                        })[0];
                    }
                    else {
                        indexInfo.columns = [];
                        indexInfo.name = resp.indexname;
                        indexInfo.isUnique = resp.is_unique == 1 ? true : false;
                        indexInfo.isPrimaryKey = resp.is_primary_key == 1 ? true : false;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.columnname;
                    if (resp.is_primary_key == 0) {
                        indexInfo.isPrimaryKey = false;
                    }
                    // indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                    //indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
                    indexInfo.columns.push(indexColumnInfo);
                });
            });
            return entities;
        });
    }
    GetRelations(entities, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = (yield this.Connection.query(`SELECT
            con.relname AS tablewithforeignkey,
            att.attnum as fk_partno,
                 att2.attname AS foreignkeycolumn,
              cl.relname AS tablereferenced,
              att.attname AS foreignkeycolumnreferenced,
               update_rule as ondelete,
               delete_rule as onupdate,
                con.conname as object_id
               FROM (
                   SELECT
                     unnest(con1.conkey) AS parent,
                     unnest(con1.confkey) AS child,
                     con1.confrelid,
                     con1.conrelid,
                     cl_1.relname,
                   con1.conname
                   FROM
                     pg_class cl_1,
                     pg_namespace ns,
                     pg_constraint con1
                   WHERE
                     con1.contype = 'f'::"char"
                     AND cl_1.relnamespace = ns.oid
                     AND con1.conrelid = cl_1.oid
                     and nspname='${schema}'
              ) con,
                pg_attribute att,
                pg_class cl,
                pg_attribute att2,
                information_schema.referential_constraints rc
              WHERE
                att.attrelid = con.confrelid
                AND att.attnum = con.child
                AND cl.oid = con.confrelid
                AND att2.attrelid = con.conrelid
                AND att2.attnum = con.parent
                and rc.constraint_name= con.conname`)).rows;
            let relationsTemp = [];
            response.forEach((resp) => {
                let rels = relationsTemp.find((val) => {
                    return val.object_id == resp.object_id;
                });
                if (rels == undefined) {
                    rels = {};
                    rels.ownerColumnsNames = [];
                    rels.referencedColumnsNames = [];
                    rels.actionOnDelete = resp.ondelete;
                    rels.actionOnUpdate = resp.onupdate;
                    rels.object_id = resp.object_id;
                    rels.ownerTable = resp.tablewithforeignkey;
                    rels.referencedTable = resp.tablereferenced;
                    relationsTemp.push(rels);
                }
                rels.ownerColumnsNames.push(resp.foreignkeycolumn);
                rels.referencedColumnsNames.push(resp.foreignkeycolumnreferenced);
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
                    referencedRelation.actionondelete = relationTmp.actionOnDelete;
                    referencedRelation.actiononupdate = relationTmp.actionOnUpdate;
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
                    referencedRelation.actionondelete = relationTmp.actionOnDelete;
                    referencedRelation.actiononupdate = relationTmp.actionOnUpdate;
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
            if (this.Connection) {
                let promise = new Promise((resolve, reject) => {
                    this.Connection.end((err) => {
                        if (!err) {
                            //Connection successfull
                            resolve(true);
                        }
                        else {
                            console.error('Error connecting to Postgres Server.');
                            console.error(err.message);
                            process.abort();
                            reject(err);
                        }
                    });
                });
                yield promise;
            }
        });
    }
    ConnectToServer(database, server, port, user, password, ssl) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Connection = new PG.Client({
                database: database,
                host: server,
                port: port,
                user: user,
                password: password,
                ssl: ssl
            });
            let promise = new Promise((resolve, reject) => {
                this.Connection.connect((err) => {
                    if (!err) {
                        //Connection successfull
                        resolve(true);
                    }
                    else {
                        console.error('Error connecting to Postgres Server.');
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
            let resp = yield this.Connection.query(`CREATE DATABASE ${dbName}; `);
        });
    }
    UseDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.Connection.query(`USE ${dbName}; `);
        });
    }
    DropDB(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.Connection.query(`DROP DATABASE ${dbName}; `);
        });
    }
    CheckIfDBExists(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.Connection.query(`SELECT datname FROM pg_database  WHERE datname  ='${dbName}' `);
            return resp.rowCount > 0;
        });
    }
}
exports.PostgresDriver = PostgresDriver;
//# sourceMappingURL=PostgresDriver.js.map