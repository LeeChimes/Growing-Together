type Mutation = { id: string; type: string; payload: any; attempts: number; createdAt: number };
const subscribers: Array<() => void> = [];

let queue: Mutation[] = [];

export function enqueueMutation(m: Omit<Mutation,'id'|'attempts'|'createdAt'>) {
  const item: Mutation = { ...m, id: crypto.randomUUID(), attempts: 0, createdAt: Date.now() } as Mutation;
  queue.push(item);
  notify();
  return item.id;
}

export function getQueue() { return queue; }
export function onQueueChange(fn: ()=>void){ subscribers.push(fn); }
function notify(){ subscribers.forEach(fn=>fn()); }

export async function processQueueOnce() {
  for (const m of [...queue]) {
    try {
      await dispatchMutation(m);
      queue = queue.filter(x => x.id !== m.id);
      notify();
    } catch (e) {
      m.attempts++;
      // optional: backoff handled by caller
    }
  }
}

async function dispatchMutation(m: Mutation) {
  switch (m.type) {
    case 'inspection.create':
      return apiCreateInspection(m.payload);
    case 'diary.create':
      return apiCreateDiary(m.payload);
    case 'post.create':
      return apiCreatePost(m.payload);
    case 'event.rsvp':
      return apiSetRsvp(m.payload);
    case 'task.create':
      return apiCreateTask(m.payload);
    case 'document.upload':
      return apiUploadDocument(m.payload);
    default:
      throw new Error(`Unknown mutation type: ${m.type}`);
  }
}

// Placeholder API implementations; integrate with existing hooks/services
async function apiCreateInspection(_payload: any) { /* integrate with useCreateInspection */ }
async function apiCreateDiary(_payload: any) { /* integrate */ }
async function apiCreatePost(_payload: any) { /* integrate */ }
async function apiSetRsvp(_payload: any) { /* integrate */ }
async function apiCreateTask(_payload: any) { /* integrate */ }
async function apiUploadDocument(_payload: any) { /* integrate */ }


