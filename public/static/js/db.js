const DB_VERSION = 1;

const db = new Dexie("PWA_Dexie");

db.version(DB_VERSION).stores({
  products: "userId",
  syncProducts: "title",
});
