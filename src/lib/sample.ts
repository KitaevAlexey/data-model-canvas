import { makeId, type TableModel } from './types'

export function buildSampleModel(): TableModel[] {
  const col = (name: string, type: string, opts: Partial<TableModel['columns'][0]> = {}) => ({
    id: makeId('col'),
    name,
    type,
    isPK: false,
    isFK: false,
    ...opts,
  })

  const tbl = (name: string, columns: TableModel['columns']): TableModel => ({
    id: makeId('tbl'),
    name,
    x: 0,
    y: 0,
    columns,
  })

  return [
    // === Измерения ===
    tbl('DimCustomer', [
      col('CustomerID', 'int', { isPK: true }),
      col('FullName', 'varchar(150)'),
      col('Segment', 'varchar(50)'),
      col('Region', 'varchar(50)'),
      col('RegistrationDate', 'date'),
    ]),
    tbl('DimDate', [
      col('DateID', 'int', { isPK: true }),
      col('Date', 'date'),
      col('Year', 'int'),
      col('Quarter', 'int'),
      col('Month', 'int'),
    ]),
    tbl('DimProduct', [
      col('ProductID', 'int', { isPK: true }),
      col('ProductName', 'varchar(150)'),
      col('Category', 'varchar(50)'),
      col('UnitPrice', 'decimal(10,2)'),
    ]),
    tbl('DimWarehouse', [
      col('WarehouseID', 'int', { isPK: true }),
      col('WarehouseName', 'varchar(100)'),
      col('City', 'varchar(50)'),
    ]),

    // === Факты ===
    tbl('FactSales', [
      col('SaleID', 'int', { isPK: true }),
      col('CustomerID', 'int', { isFK: true, refTable: 'DimCustomer', refColumn: 'CustomerID' }),
      col('ProductID', 'int', { isFK: true, refTable: 'DimProduct', refColumn: 'ProductID' }),
      col('DateID', 'int', { isFK: true, refTable: 'DimDate', refColumn: 'DateID' }),
      col('Quantity', 'int'),
      col('Amount', 'decimal(12,2)'),
    ]),
    tbl('FactShipment', [
      col('ShipmentID', 'int', { isPK: true }),
      col('ProductID', 'int', { isFK: true, refTable: 'DimProduct', refColumn: 'ProductID' }),
      col('WarehouseID', 'int', { isFK: true, refTable: 'DimWarehouse', refColumn: 'WarehouseID' }),
      col('DateID', 'int', { isFK: true, refTable: 'DimDate', refColumn: 'DateID' }),
      col('Quantity', 'int'),
    ]),
    tbl('FactProduction', [
      col('ProductionID', 'int', { isPK: true }),
      col('ProductID', 'int', { isFK: true, refTable: 'DimProduct', refColumn: 'ProductID' }),
      col('WarehouseID', 'int', { isFK: true, refTable: 'DimWarehouse', refColumn: 'WarehouseID' }),
      col('DateID', 'int', { isFK: true, refTable: 'DimDate', refColumn: 'DateID' }),
      col('Quantity', 'int'),
      col('Cost', 'decimal(12,2)'),
    ]),
  ]
}