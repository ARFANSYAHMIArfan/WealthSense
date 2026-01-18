
import * as Realm from "realm-web";

/**
 * ---------------------------------------------------------
 * MONGODB ATLAS APP ID
 * ---------------------------------------------------------
 * 1. Go to "App Services" in the left menu of your screenshot.
 * 2. Create a new App (name it WealthSense).
 * 3. Copy the "App ID" from the top left of that dashboard.
 * 4. Paste it below between the quotes.
 */
const APP_ID = ""; // <--- PASTE YOUR APP ID HERE (e.g., "wealthsense-abcde")

let app: Realm.App | null = null;
if (APP_ID) {
  app = new Realm.App({ id: APP_ID });
}

export const isAtlasConfigured = () => !!APP_ID;

const getCollection = async (collectionName: string) => {
  // If no App ID is provided yet, use LocalStorage so the app doesn't crash
  if (!app || !APP_ID) {
    return new LocalMongoCollection(collectionName);
  }

  try {
    // 1. Log in anonymously (Make sure this is enabled in Atlas App Services -> Authentication)
    if (!app.currentUser) {
      await app.logIn(Realm.Credentials.anonymous());
    }
    
    // 2. Access the MongoDB service (Standard name is "mongodb-atlas")
    const mongodb = app.currentUser.mongoClient("mongodb-atlas");
    
    // 3. Return the collection from the "wealthsense" database
    return mongodb.db("wealthsense").collection(collectionName);
  } catch (error) {
    console.warn("MongoDB Atlas not connected, using Local Storage fallback:", error);
    return new LocalMongoCollection(collectionName);
  }
};

/**
 * Fallback storage logic
 * This ensures your app works even before you finish the MongoDB setup.
 */
class LocalMongoCollection {
  private key: string;
  constructor(name: string) {
    this.key = `ws_db_${name}`;
  }
  private _get() {
    const d = localStorage.getItem(this.key);
    return d ? JSON.parse(d) : [];
  }
  private _set(d: any[]) {
    localStorage.setItem(this.key, JSON.stringify(d));
  }
  async find(query: any = {}) {
    const all = this._get();
    return all.filter((item: any) => {
      for (const k in query) if (item[k] !== query[k]) return false;
      return true;
    });
  }
  async insertOne(doc: any) {
    const all = this._get();
    all.push(doc);
    this._set(all);
    return doc;
  }
  async updateOne(query: any, update: any) {
    const all = this._get();
    const idx = all.findIndex((item: any) => {
      for (const k in query) if (item[k] !== query[k]) return false;
      return true;
    });
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...update };
      this._set(all);
    }
  }
  async deleteOne(query: any) {
    const all = this._get();
    const idx = all.findIndex((item: any) => {
      for (const k in query) if (item[k] !== query[k]) return false;
      return true;
    });
    if (idx !== -1) {
      all.splice(idx, 1);
      this._set(all);
    }
  }
}

export const db = {
  accounts: {
    find: async (q?: any) => (await getCollection("accounts")).find(q),
    insertOne: async (d: any) => (await getCollection("accounts")).insertOne(d),
    updateOne: async (q: any, u: any) => (await getCollection("accounts")).updateOne(q, u),
    deleteOne: async (q: any) => (await getCollection("accounts")).deleteOne(q),
  },
  transactions: {
    find: async (q?: any) => (await getCollection("transactions")).find(q),
    insertOne: async (d: any) => (await getCollection("transactions")).insertOne(d),
    updateOne: async (q: any, u: any) => (await getCollection("transactions")).updateOne(q, u),
    deleteOne: async (q: any) => (await getCollection("transactions")).deleteOne(q),
  },
  bills: {
    find: async (q?: any) => (await getCollection("bills")).find(q),
    insertOne: async (d: any) => (await getCollection("bills")).insertOne(d),
    updateOne: async (q: any, u: any) => (await getCollection("bills")).updateOne(q, u),
    deleteOne: async (q: any) => (await getCollection("bills")).deleteOne(q),
  },
  recurring: {
    find: async (q?: any) => (await getCollection("recurring")).find(q),
    insertOne: async (d: any) => (await getCollection("recurring")).insertOne(d),
    updateOne: async (q: any, u: any) => (await getCollection("recurring")).updateOne(q, u),
    deleteOne: async (q: any) => (await getCollection("recurring")).deleteOne(q),
  },
  goals: {
    find: async (q?: any) => (await getCollection("goals")).find(q),
    insertOne: async (d: any) => (await getCollection("goals")).insertOne(d),
    updateOne: async (q: any, u: any) => (await getCollection("goals")).updateOne(q, u),
    deleteOne: async (q: any) => (await getCollection("goals")).deleteOne(q),
  },
};
