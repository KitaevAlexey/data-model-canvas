import { makeId, type TableModel } from './types'

export function buildSampleModel(): TableModel[] {
  const customers: TableModel = {
    id: makeId('tbl'),
    name: 'Customers',
    x: 60,
    y: 60,
    columns: [
      { id: makeId('col'), name: 'ID', type: 'int', isPK: true, isFK: false },
      { id: makeId('col'), name: 'Name', type: 'varchar(100)', isPK: false, isFK: false },
      { id: makeId('col'), name: 'Segment', type: 'varchar(50)', isPK: false, isFK: false },
    ],
  }

  const products: TableModel = {
    id: makeId('tbl'),
    name: 'Products',
    x: 420,
    y: 60,
    columns: [
      { id: makeId('col'), name: 'ID', type: 'int', isPK: true, isFK: false },
      { id: makeId('col'), name: 'Name', type: 'varchar(150)', isPK: false, isFK: false },
      { id: makeId('col'), name: 'Price', type: 'decimal(10,2)', isPK: false, isFK: false },
    ],
  }

  const orders: TableModel = {
    id: makeId('tbl'),
    name: 'Orders',
    x: 60,
    y: 360,
    columns: [
      { id: makeId('col'), name: 'ID', type: 'int', isPK: true, isFK: false },
      {
        id: makeId('col'),
        name: 'CustomerID',
        type: 'int',
        isPK: false,
        isFK: true,
        refTable: 'Customers',
        refColumn: 'ID',
      },
      { id: makeId('col'), name: 'OrderDate', type: 'date', isPK: false, isFK: false },
      { id: makeId('col'), name: 'Amount', type: 'decimal(10,2)', isPK: false, isFK: false },
    ],
  }

  const orderItems: TableModel = {
    id: makeId('tbl'),
    name: 'OrderItems',
    x: 420,
    y: 360,
    columns: [
      { id: makeId('col'), name: 'ID', type: 'int', isPK: true, isFK: false },
      {
        id: makeId('col'),
        name: 'OrderID',
        type: 'int',
        isPK: false,
        isFK: true,
        refTable: 'Orders',
        refColumn: 'ID',
      },
      {
        id: makeId('col'),
        name: 'ProductID',
        type: 'int',
        isPK: false,
        isFK: true,
        refTable: 'Products',
        refColumn: 'ID',
      },
      { id: makeId('col'), name: 'Quantity', type: 'int', isPK: false, isFK: false },
    ],
  }

  return [customers, products, orders, orderItems]
}