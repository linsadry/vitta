/**
 * storage.js — Camada de persistência local
 *
 * Usa IndexedDB para dados volumosos (refeições, treinos, fotos)
 * e localStorage para preferências e dados simples.
 * Nenhum dado sai do dispositivo.
 */

const DB_NAME    = 'fitness-os';
const DB_VERSION = 1;

const Storage = (() => {
  let db = null;

  // ── INDEXEDDB ────────────────────────────────────────────────
  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const d = e.target.result;

        // Refeições
        if (!d.objectStoreNames.contains('meals')) {
          const ms = d.createObjectStore('meals', { keyPath: 'id', autoIncrement: true });
          ms.createIndex('date', 'date', { unique: false });
        }

        // Treinos
        if (!d.objectStoreNames.contains('workouts')) {
          const ws = d.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
          ws.createIndex('date', 'date', { unique: false });
        }

        // Medidas corporais
        if (!d.objectStoreNames.contains('measurements')) {
          const ms2 = d.createObjectStore('measurements', { keyPath: 'id', autoIncrement: true });
          ms2.createIndex('date', 'date', { unique: false });
        }

        // Registros de água (por dia)
        if (!d.objectStoreNames.contains('water')) {
          d.createObjectStore('water', { keyPath: 'date' });
        }

        // Fotos de progresso
        if (!d.objectStoreNames.contains('progressPhotos')) {
          const ps = d.createObjectStore('progressPhotos', { keyPath: 'id', autoIncrement: true });
          ps.createIndex('date', 'date', { unique: false });
        }
      };

      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror   = (e) => reject(e.target.error);
    });
  }

  function tx(storeName, mode = 'readonly') {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function getAll(storeName, indexName, value) {
    return openDB().then(() => new Promise((resolve, reject) => {
      const store = tx(storeName);
      const req   = indexName
        ? store.index(indexName).getAll(value)
        : store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    }));
  }

  function put(storeName, record) {
    return openDB().then(() => new Promise((resolve, reject) => {
      const req = tx(storeName, 'readwrite').put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    }));
  }

  function del(storeName, key) {
    return openDB().then(() => new Promise((resolve, reject) => {
      const req = tx(storeName, 'readwrite').delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    }));
  }

  // ── LOCALSTORAGE (preferências + dados simples) ───────────────
  const LS = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v !== null ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch {}
    },
  };

  // ── API PÚBLICA ───────────────────────────────────────────────
  return {
    // Preferências do usuário
    prefs: {
      get: (key, fallback)  => LS.get(`prefs:${key}`, fallback),
      set: (key, value)     => LS.set(`prefs:${key}`, value),
    },

    // Água: {date: 'YYYY-MM-DD', ml: 1750}
    water: {
      getToday: () => {
        const today = Utils.dateKey();
        return openDB().then(() => new Promise((resolve) => {
          const req = tx('water').get(today);
          req.onsuccess = () => resolve(req.result || { date: today, ml: 0 });
          req.onerror   = () => resolve({ date: today, ml: 0 });
        }));
      },
      saveToday: (ml) => {
        const today = Utils.dateKey();
        return put('water', { date: today, ml });
      },
      getWeek: () => {
        const days = Utils.lastNDays(7);
        return openDB().then(() => Promise.all(
          days.map(d => new Promise((resolve) => {
            const req = tx('water').get(d);
            req.onsuccess = () => resolve({ date: d, ml: req.result?.ml || 0 });
            req.onerror   = () => resolve({ date: d, ml: 0 });
          }))
        ));
      },
    },

    // Refeições
    meals: {
      getByDate: (date) => getAll('meals', 'date', date),
      add:       (meal) => put('meals', { ...meal, date: meal.date || Utils.dateKey(), createdAt: Date.now() }),
      delete:    (id)   => del('meals', id),
    },

    // Treinos
    workouts: {
      getByDate: (date) => getAll('workouts', 'date', date),
      getWeek:   ()     => {
        const days = Utils.lastNDays(7);
        return openDB().then(() => Promise.all(
          days.map(d => getAll('workouts', 'date', d).then(w => ({ date: d, workouts: w })))
        ));
      },
      add:    (workout) => put('workouts', { ...workout, date: workout.date || Utils.dateKey(), createdAt: Date.now() }),
      delete: (id)      => del('workouts', id),
    },

    // Medidas
    measurements: {
      getLatest: () => getAll('measurements').then(all =>
        all.sort((a, b) => b.date.localeCompare(a.date))[0] || null
      ),
      add: (m) => put('measurements', { ...m, date: m.date || Utils.dateKey(), createdAt: Date.now() }),
    },

    // Peso (via localStorage por simplicidade)
    weight: {
      getHistory: () => LS.get('weight:history', []),
      addEntry: (kg) => {
        const hist = LS.get('weight:history', []);
        hist.push({ date: Utils.dateKey(), kg });
        if (hist.length > 180) hist.shift(); // últimos 6 meses
        LS.set('weight:history', hist);
      },
      getLatest: () => {
        const hist = LS.get('weight:history', []);
        return hist.length ? hist[hist.length - 1].kg : null;
      },
    },

    // Score de consistência (calculado, salvo por dia)
    score: {
      save: (date, score) => LS.set(`score:${date}`, score),
      get:  (date)        => LS.get(`score:${date}`, null),
      getWeek: () => Utils.lastNDays(7).map(d => ({
        date: d,
        score: LS.get(`score:${d}`, null),
      })),
    },

    // Hábitos do dia
    habits: {
      getToday: () => LS.get(`habits:${Utils.dateKey()}`, {
        sleep: false, water: false, workout: false, protein: false, meals: false,
      }),
      setToday: (habits) => LS.set(`habits:${Utils.dateKey()}`, habits),
      toggle: (key) => {
        const h = LS.get(`habits:${Utils.dateKey()}`, {
          sleep: false, water: false, workout: false, protein: false, meals: false,
        });
        h[key] = !h[key];
        LS.set(`habits:${Utils.dateKey()}`, h);
        return h;
      },
    },

    // Limpar todos os dados locais
    clearAll: async () => {
      localStorage.clear();
      const d = await openDB();
      const stores = ['meals', 'workouts', 'measurements', 'water', 'progressPhotos'];
      const t = d.transaction(stores, 'readwrite');
      stores.forEach(s => t.objectStore(s).clear());
      return new Promise((res, rej) => { t.oncomplete = res; t.onerror = rej; });
    },

    init: openDB,
  };
})();
