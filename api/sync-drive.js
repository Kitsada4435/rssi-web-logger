module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { logs, trip_id, participant_id, webhook_url } = req.body || {};
  const targetWebhook = webhook_url || process.env.GOOGLE_DRIVE_WEBHOOK_URL;

  if (!targetWebhook) {
    res.status(400).json({
      status: 'error',
      message: 'Missing Google Drive Webhook URL. Please configure it in settings or environment variables.'
    });
    return;
  }

  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    res.status(400).json({ status: 'error', message: 'No logs to sync' });
    return;
  }

  try {
    const payload = {
      action: 'batch_upload',
      trip_id: trip_id || 'TRIP-DEFAULT',
      participant_id: participant_id || 'USR-ANON',
      save_csv: true,
      logs: logs
    };

    const response = await fetch(targetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({ status: 'success', raw: 'Non-JSON response' }));
    res.status(200).json({ status: 'ok', google_response: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
