import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK using Application Default Credentials (ADC)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'liberty-crm-integrations';
  
  if (typeof window === 'undefined') {
    // If GCP_CREDENTIALS JSON string is present (e.g. on Vercel), write it to a temporary file
    if (process.env.GCP_CREDENTIALS) {
      try {
        const fs = require('fs');
        const path = require('path');
        const credPath = path.join('/tmp', 'gcp-creds.json');
        fs.writeFileSync(credPath, process.env.GCP_CREDENTIALS);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
      } catch (err) {
        console.error('Failed to write GCP_CREDENTIALS at runtime:', err);
      }
    } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Local development fallback
      const fs = require('fs');
      const localCreds = '/Users/STUDIO/.config/gcloud/application_default_credentials.json';
      if (fs.existsSync(localCreds)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = localCreds;
      }
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId
      });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      admin.initializeApp({ projectId });
    }
  } else {
    admin.initializeApp({ projectId });
  }
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Helper to convert Firestore Timestamps to JS Date objects recursively
function convertTimestamps(data: any): any {
  if (data === null || data === undefined) return data;
  if (data && typeof data.toDate === 'function') {
    return data.toDate();
  }
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item));
  }
  if (typeof data === 'object') {
    const copy: any = {};
    for (const [key, value] of Object.entries(data)) {
      copy[key] = convertTimestamps(value);
    }
    return copy;
  }
  return data;
}

// Helper to remove undefined values from objects before sending to Firestore
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const copy: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        copy[key] = removeUndefined(value);
      }
    }
    return copy;
  }
  return obj;
}

// Fetch all documents in a collection
async function fetchCollectionDocs(collectionName: string): Promise<any[]> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map(doc => {
    const data = convertTimestamps(doc.data());
    return {
      id: doc.id,
      ...data
    };
  });
}

// Check if a document matches the Prisma where clause in memory
function evaluateWhere(item: any, where: any): boolean {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === 'NOT') {
      if (evaluateWhere(item, value)) return false;
      continue;
    }
    const itemValue = item[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('in' in value) {
        const arr = (value as any).in;
        if (!Array.isArray(arr) || !arr.includes(itemValue)) return false;
      }
      if ('contains' in value) {
        const containsVal = String((value as any).contains).toLowerCase();
        if (!String(itemValue || '').toLowerCase().includes(containsVal)) return false;
      }
      if ('equals' in value) {
        if (itemValue !== (value as any).equals) return false;
      }
      if ('not' in value) {
        if (itemValue === (value as any).not) return false;
      }
    } else {
      // Plain equality check
      if (itemValue !== value) return false;
    }
  }
  return true;
}

// Resolve includes for relations in memory
async function resolveIncludes(items: any[], include: any) {
  if (!include || items.length === 0) return;
  for (const [relKey, relValue] of Object.entries(include)) {
    if (!relValue) continue;

    if (relKey === 'notes') {
      const allNotes = await fetchCollectionDocs('notes');
      for (const item of items) {
        let matchingNotes = allNotes.filter(n => n.applicantId === item.id);
        if (typeof relValue === 'object' && (relValue as any).orderBy) {
          const [field, direction] = Object.entries((relValue as any).orderBy)[0];
          matchingNotes.sort((a, b) => {
            const valA = a[field];
            const valB = b[field];
            if (valA === valB) return 0;
            if (valA === undefined) return direction === 'asc' ? -1 : 1;
            if (valB === undefined) return direction === 'asc' ? 1 : -1;
            if (valA instanceof Date && valB instanceof Date) {
              return direction === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
            }
            return direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
          });
        }
        item.notes = matchingNotes;
      }
    }

    if (relKey === 'documents') {
      const allDocs = await fetchCollectionDocs('documents');
      for (const item of items) {
        item.documents = allDocs.filter(d => d.applicantId === item.id);
      }
    }

    if (relKey === 'crate') {
      const allCrates = await fetchCollectionDocs('crates');
      for (const item of items) {
        item.crate = allCrates.find(c => c.id === item.crateId) || null;
      }
    }

    if (relKey === 'user') {
      const allUsers = await fetchCollectionDocs('users');
      for (const item of items) {
        item.user = allUsers.find(u => u.id === item.userId) || null;
      }
    }

    if (relKey === 'generations') {
      const allGenerations = await fetchCollectionDocs('generations');
      for (const item of items) {
        item.generations = allGenerations.filter(g => g.crateId === item.id);
      }
    }

    if (relKey === 'crates') {
      const allCrates = await fetchCollectionDocs('crates');
      for (const item of items) {
        item.crates = allCrates.filter(c => c.userId === item.id);
      }
    }
  }
}

// Create a collection adapter providing standard Prisma queries mapped to Firestore
function createCollectionAdapter(collectionName: string) {
  return {
    findMany: async (options: { where?: any; orderBy?: any; include?: any; take?: number; skip?: number } = {}) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      let items = allDocs.filter(doc => evaluateWhere(doc, options.where));

      if (options.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0];
        items.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return direction === 'asc' ? -1 : 1;
          if (valB === undefined || valB === null) return direction === 'asc' ? 1 : -1;
          
          if (valA instanceof Date && valB instanceof Date) {
            return direction === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
          }
          return direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
        });
      }

      if (options.skip) {
        items = items.slice(options.skip);
      }
      if (options.take) {
        items = items.slice(0, options.take);
      }

      await resolveIncludes(items, options.include);
      return items;
    },

    findUnique: async (options: { where: any; include?: any }) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      const found = allDocs.find(doc => evaluateWhere(doc, options.where));
      if (!found) return null;
      const items = [found];
      await resolveIncludes(items, options.include);
      return items[0];
    },

    findFirst: async (options: { where?: any; include?: any }) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      const found = allDocs.find(doc => evaluateWhere(doc, options.where));
      if (!found) return null;
      const items = [found];
      await resolveIncludes(items, options.include);
      return items[0];
    },

    create: async (options: { data: any }) => {
      const data = options.data;
      // Determine document ID
      let docId = data.id;
      if (collectionName === 'settings' && data.key) {
        docId = data.key;
      }
      if (!docId) {
        docId = db.collection(collectionName).doc().id;
      }

      const cleanData: any = { id: docId };
      const relationCreates: Array<{ collection: string; data: any }> = [];

      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object') {
          if (key === 'notes' && (value as any).create) {
            const creates = Array.isArray((value as any).create) ? (value as any).create : [(value as any).create];
            for (const c of creates) {
              relationCreates.push({ collection: 'notes', data: { ...c, applicantId: docId } });
            }
          } else if (key === 'documents' && (value as any).create) {
            const creates = Array.isArray((value as any).create) ? (value as any).create : [(value as any).create];
            for (const c of creates) {
              relationCreates.push({ collection: 'documents', data: { ...c, applicantId: docId } });
            }
          }
        } else if (value !== undefined) {
          cleanData[key] = value;
        }
      }

      cleanData.createdAt = cleanData.createdAt || new Date().toISOString();
      cleanData.updatedAt = new Date().toISOString();

      // Write main document
      await db.collection(collectionName).doc(docId).set(cleanData);

      // Write relation documents
      for (const rel of relationCreates) {
        const relId = db.collection(rel.collection).doc().id;
        await db.collection(rel.collection).doc(relId).set({
          id: relId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...rel.data
        });
      }

      return cleanData;
    },

    createMany: async (options: { data: any[] }) => {
      const batch = db.batch();
      for (const item of options.data) {
        let docId = item.id;
        if (collectionName === 'settings' && item.key) {
          docId = item.key;
        }
        if (!docId) {
          docId = db.collection(collectionName).doc().id;
        }
        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, {
          id: docId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...item
        });
      }
      await batch.commit();
      return { count: options.data.length };
    },

    update: async (options: { where: any; data: any; include?: any }) => {
      // Find document id
      const allDocs = await fetchCollectionDocs(collectionName);
      const found = allDocs.find(doc => evaluateWhere(doc, options.where));
      if (!found) {
        throw new Error(`Record to update not found in ${collectionName}`);
      }

      const docId = found.id;
      const cleanData: any = {};
      const relationCreates: Array<{ collection: string; data: any }> = [];

      for (const [key, value] of Object.entries(options.data)) {
        if (value && typeof value === 'object') {
          if (key === 'notes' && (value as any).create) {
            const creates = Array.isArray((value as any).create) ? (value as any).create : [(value as any).create];
            for (const c of creates) {
              relationCreates.push({ collection: 'notes', data: { ...c, applicantId: docId } });
            }
          } else if (key === 'documents' && (value as any).create) {
            const creates = Array.isArray((value as any).create) ? (value as any).create : [(value as any).create];
            for (const c of creates) {
              relationCreates.push({ collection: 'documents', data: { ...c, applicantId: docId } });
            }
          }
        } else if (value !== undefined) {
          cleanData[key] = value;
        }
      }

      cleanData.updatedAt = new Date().toISOString();
      await db.collection(collectionName).doc(docId).update(cleanData);

      for (const rel of relationCreates) {
        const relId = db.collection(rel.collection).doc().id;
        await db.collection(rel.collection).doc(relId).set({
          id: relId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...rel.data
        });
      }

      const updatedDoc = { ...found, ...cleanData };
      const items = [updatedDoc];
      await resolveIncludes(items, options.include);
      return items[0];
    },

    updateMany: async (options: { where: any; data: any }) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      const matching = allDocs.filter(doc => evaluateWhere(doc, options.where));
      
      const batch = db.batch();
      for (const doc of matching) {
        const docRef = db.collection(collectionName).doc(doc.id);
        const cleanData = removeUndefined({
          ...options.data,
          updatedAt: new Date().toISOString()
        });
        batch.update(docRef, cleanData);
      }
      await batch.commit();
      return { count: matching.length };
    },

    upsert: async (options: { where: any; update: any; create: any }) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      const found = allDocs.find(doc => evaluateWhere(doc, options.where));
      if (found) {
        const docRef = db.collection(collectionName).doc(found.id);
        const updatedData = removeUndefined({
          ...options.update,
          updatedAt: new Date().toISOString()
        });
        await docRef.update(updatedData);
        return { id: found.id, ...found, ...updatedData };
      } else {
        const data = options.create;
        let docId = data.id;
        if (collectionName === 'settings' && data.key) {
          docId = data.key;
        }
        if (!docId) {
          docId = db.collection(collectionName).doc().id;
        }
        const docRef = db.collection(collectionName).doc(docId);
        const createdData = {
          id: docId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data
        };
        await docRef.set(createdData);
        return createdData;
      }
    },

    delete: async (options: { where: any }) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      const found = allDocs.find(doc => evaluateWhere(doc, options.where));
      if (!found) {
        throw new Error(`Record to delete not found in ${collectionName}`);
      }
      await db.collection(collectionName).doc(found.id).delete();
      return found;
    },

    deleteMany: async (options: { where?: any } = {}) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      const matching = options.where ? allDocs.filter(doc => evaluateWhere(doc, options.where)) : allDocs;

      const batch = db.batch();
      for (const doc of matching) {
        const docRef = db.collection(collectionName).doc(doc.id);
        batch.delete(docRef);
      }
      await batch.commit();
      return { count: matching.length };
    },

    count: async (options: { where?: any } = {}) => {
      const allDocs = await fetchCollectionDocs(collectionName);
      const matching = options.where ? allDocs.filter(doc => evaluateWhere(doc, options.where)) : allDocs;
      return matching.length;
    }
  };
}

export class PrismaClient {
  user = createCollectionAdapter('users');
  generation = createCollectionAdapter('generations');
  crate = createCollectionAdapter('crates');
  playlist = createCollectionAdapter('playlists');
  applicant = createCollectionAdapter('applicants');
  note = createCollectionAdapter('notes');
  document = createCollectionAdapter('documents');
  setting = createCollectionAdapter('settings');

  async $connect() {}
  async $disconnect() {}

  async $transaction(callback: (tx: any) => Promise<any>) {
    return await callback(this);
  }
}

export const prisma = new PrismaClient();
