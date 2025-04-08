import {
  createStore,
  del,
  delMany,
  get,
  getMany,
  keys,
  setMany,
} from "idb-keyval"

const isClient = typeof window !== "undefined"

type StoreNames = "chats" | "messages" | "sync"
type Stores = Record<StoreNames, ReturnType<typeof createStore>>

// define named object stores
const stores: Stores | null = isClient
  ? {
      chats: createStore("zola-db", "chats"),
      messages: createStore("zola-db", "messages"),
      sync: createStore("zola-db", "sync"),
    }
  : null

// ensure stores are initialized (no-op read)
if (isClient) {
  Object.values(stores!).forEach((store) => {
    get("__init__", store).catch(() => {})
  })
}

// read one or all items from a store
export async function readFromIndexedDB<T>(
  table: StoreNames,
  key?: string
): Promise<T | T[]> {
  if (!isClient) return key ? (null as T) : ([] as T[])
  const store = stores![table]
  if (key) {
    const item = await get<T>(key, store)
    return item as T
  }

  const allKeys = await keys(store)
  const values = await getMany<T>(allKeys as string[], store)
  return values
}

// write one or multiple items to a store
export async function writeToIndexedDB<T extends { id: string | number }>(
  table: StoreNames,
  data: T | T[]
): Promise<void> {
  if (!isClient) return
  const store = stores![table]
  const entries: [IDBValidKey, T][] = Array.isArray(data)
    ? data.map((item) => [item.id, item])
    : [[data.id, data]]

  await setMany(entries, store)
}

// delete one or all items from a store
export async function deleteFromIndexedDB(
  table: StoreNames,
  key?: string
): Promise<void> {
  if (!isClient) return
  const store = stores![table]

  if (key) {
    await del(key, store)
  } else {
    const allKeys = await keys(store)
    await delMany(allKeys as string[], store)
  }
}

export async function clearAllIndexedDBStores() {
  if (!isClient) return
  await deleteFromIndexedDB("chats")
  await deleteFromIndexedDB("messages")
  await deleteFromIndexedDB("sync")
}
