export type OfflineRequest = {
  endpoint: string;
  options: any;
};

let queue: OfflineRequest[] = [];
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('offline_requests');
    if (stored) {
      queue = JSON.parse(stored);
    }
  } catch (e) {}
}

const saveQueue = () => {
  localStorage.setItem('offline_requests', JSON.stringify(queue));
};

export const addOfflineRequest = (req: OfflineRequest) => {
  queue.push(req);
  saveQueue();
};

export const getOfflineRequests = () => queue;

export const removeOfflineRequest = (index: number) => {
  queue.splice(index, 1);
  saveQueue();
};

export const clearOfflineRequests = () => {
  queue = [];
  saveQueue();
};
