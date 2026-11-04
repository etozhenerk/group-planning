let database: Promise<IDBDatabase> | undefined;

export const openPrivateDatabase = () => {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('somewhere-private-chat', 1);
      request.onupgradeneeded = () => {
        for (const name of ['records', 'epochs', 'leases']) {
          request.result.createObjectStore(name);
        }
      };

      request.onerror = () =>
        reject(request.error ?? new Error('IndexedDB request failed'));
      request.onblocked = () => reject(new Error('Private storage blocked'));
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          database = undefined;
        };

        resolve(request.result);
      };
    }).catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  }

  return database;
};

export const idbResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed'));
  });

export const privateTransaction = async <T>(
  operation: (transaction: IDBTransaction) => Promise<T>,
) => {
  const db = await openPrivateDatabase();
  const transaction = db.transaction(['records', 'epochs', 'leases'], 'readwrite');
  const done = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Private transaction aborted'));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });

  try {
    const result = await operation(transaction);
    await done;

    return result;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      /* Already completed/aborted. */
    }

    await done.catch(() => undefined);

    throw error;
  }
};
