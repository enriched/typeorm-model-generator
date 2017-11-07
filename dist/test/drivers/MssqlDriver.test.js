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
const chai_1 = require("chai");
const MssqlDriver_1 = require("./../../src/drivers/MssqlDriver");
const Sinon = require("sinon");
const MSSQL = require("mssql");
const EntityInfo_1 = require("./../../src/models/EntityInfo");
const mssql_1 = require("mssql");
class fakeResponse {
}
class fakeRecordset extends Array {
    toTable() {
        return new mssql_1.Table();
    }
}
describe('MssqlDriver', function () {
    let driver;
    let sandbox = Sinon.sandbox.create();
    beforeEach(() => {
        driver = new MssqlDriver_1.MssqlDriver();
        // sandbox.mock()
        //  sandbox.stub( (<any>driver).Connection,)
        //  driver = Sinon.createStubInstance(MssqlDriver);
        //  sandbox.stub(MSSQL,'Connection')
        //  .callsFake( (a,b)=>{
        //      console.log(a)
        //      b({message:'a'})
        //  })
        // sandbox.stub(MSSQL.)
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('should get tables info', () => __awaiter(this, void 0, void 0, function* () {
        sandbox.stub(MSSQL, 'Request')
            .returns({
            query: (q) => {
                let response = new fakeResponse();
                response.recordset = new fakeRecordset();
                response.recordset.push({ TABLE_SCHEMA: 'schema', TABLE_NAME: 'name' });
                return response;
            }
        });
        let result = yield driver.GetAllTables('schema');
        let expectedResult = [];
        let y = new EntityInfo_1.EntityInfo();
        y.EntityName = 'name';
        y.Columns = [];
        y.Indexes = [];
        expectedResult.push(y);
        chai_1.expect(result).to.be.deep.equal(expectedResult);
    }));
    it('should get columns info', () => __awaiter(this, void 0, void 0, function* () {
        sandbox.stub(MSSQL, 'Request')
            .returns({
            query: (q) => {
                let response = new fakeResponse();
                response.recordset = new fakeRecordset();
                response.recordset.push({
                    TABLE_NAME: 'name', CHARACTER_MAXIMUM_LENGTH: 0,
                    COLUMN_DEFAULT: 'a', COLUMN_NAME: 'name', DATA_TYPE: 'int',
                    IS_NULLABLE: 'YES', NUMERIC_PRECISION: 0, NUMERIC_SCALE: 0,
                    IsIdentity: 1
                });
                return response;
            }
        });
        let entities = [];
        let y = new EntityInfo_1.EntityInfo();
        y.EntityName = 'name';
        y.Columns = [];
        y.Indexes = [];
        entities.push(y);
        var expected = JSON.parse(JSON.stringify(entities));
        expected[0].Columns.push({
            char_max_lenght: null,
            default: 'a',
            is_nullable: true,
            isPrimary: false,
            is_generated: true,
            name: 'name',
            numericPrecision: null,
            numericScale: null,
            sql_type: 'int',
            ts_type: 'number',
            relations: []
        });
        let result = yield driver.GetCoulmnsFromEntity(entities, 'schema');
        chai_1.expect(result).to.be.deep.equal(expected);
    }));
    it('should find primary indexes');
    it('should get indexes info');
    it('should get relations info');
});
//# sourceMappingURL=MssqlDriver.test.js.map