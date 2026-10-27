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
    // === ФАКТ ===
    tbl('FactSales', [
      col('SaleID', 'int', { isPK: true }),
      col('DateID', 'int', { isFK: true, refTable: 'DimDate', refColumn: 'DateID' }),
      // ОШИБКА 1: Тип varchar не совпадает с int в DimCustomer
      col('CustomerID', 'varchar(50)', { isFK: true, refTable: 'DimCustomer', refColumn: 'CustomerID' }),
      col('ProductID', 'int', { isFK: true, refTable: 'DimProduct', refColumn: 'ProductID' }),
      col('StoreID', 'int', { isFK: true, refTable: 'DimStore', refColumn: 'StoreID' }),
      col('PromotionID', 'int', { isFK: true, refTable: 'DimPromotion', refColumn: 'PromotionID' }),
      col('PaymentMethodID', 'int', { isFK: true, refTable: 'DimPayment', refColumn: 'PaymentMethodID' }),
      col('Quantity', 'int'),
      col('Amount', 'decimal(12,2)'),
    ]),

    // === ИЗМЕРЕНИЯ 1-ГО УРОВНЯ ===
    tbl('DimDate', [
      col('DateID', 'int', { isPK: true }),
      col('Date', 'date'),
      col('Year', 'int'),
      col('Quarter', 'int'),
      col('Month', 'int'),
    ]),
    tbl('DimCustomer', [
      col('CustomerID', 'int', { isPK: true }), // Здесь int
      col('FullName', 'varchar(150)'),
      col('Email', 'varchar(100)'),
      col('RegionID', 'int', { isFK: true, refTable: 'DimRegion', refColumn: 'RegionID' }),
    ]),
    tbl('DimProduct', [
      col('ProductID', 'int', { isPK: true }),
      col('ProductName', 'varchar(150)'),
      col('Price', 'decimal(10,2)'),
      col('CategoryID', 'int', { isFK: true, refTable: 'DimCategory', refColumn: 'CategoryID' }),
    ]),
    
    // ОШИБКА 2: В таблице DimStore отсутствует Primary Key (isPK: true)
    tbl('DimStore', [
      col('StoreID', 'int'), 
      col('StoreName', 'varchar(100)'),
      col('City', 'varchar(50)'),
    ]),
    
    tbl('DimPromotion', [
      col('PromotionID', 'int', { isPK: true }),
      col('PromotionName', 'varchar(100)'),
      col('Discount', 'decimal(5,2)'),
    ]),
    tbl('DimPayment', [
      col('PaymentMethodID', 'int', { isPK: true }),
      col('MethodName', 'varchar(50)'),
    ]),

    // === ИЗМЕРЕНИЯ 2-ГО УРОВНЯ ===
    tbl('DimRegion', [
      col('RegionID', 'int', { isPK: true }),
      col('RegionName', 'varchar(100)'),
      col('Country', 'varchar(50)'),
    ]),
    tbl('DimCategory', [
      col('CategoryID', 'int', { isPK: true }),
      col('CategoryName', 'varchar(100)'),
      col('Department', 'varchar(50)'),
    ]),
  ]
}