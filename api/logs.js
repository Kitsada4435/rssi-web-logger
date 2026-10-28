let memoryStore = global._rssiMemoryStore || [];
global._rssiMemoryStore = memoryStore;

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'DELETE') {
    global._rssiMemoryStore = [];
    return res.status(200).json({ status: 'ok', message: 'Cleared' });
  }
  res.status(200).json({ status: 'ok', count: memoryStore.length, logs: memoryStore });
};
