// import { IDocMeta } from '@/types';
import Dexie, { Table } from 'dexie';

export class MyDocDb extends Dexie {
  constructor() {
    super('myDocDb');
    this.version(1).stores({
      docs: '++id, folderName, fileName, fileSourceData, model',
    });
  }
}

export const db = new MyDocDb();
