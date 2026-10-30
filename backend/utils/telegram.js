/**
 * CivicLens Telegram Bot Automation Service
 * Sends real-time civic complaint alerts (with Cloudinary photos/videos + Google Maps pin)
 * and responds to /start, /status <ID>, and /top commands.
 */

let subscribedChatIds = new Set();
let pollingActive = false;
let lastUpdateId = 0;

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
}

function getTargetChatIds() {
  const envChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (envChatId) {
    envChatId.split(',').map((id) => id.trim()).filter(Boolean).forEach((id) => subscribedChatIds.add(id));
  }
  return Array.from(subscribedChatIds);
}

async function telegramRequest(method, body) {
  const token = getBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.warn(`⚠️ Telegram API (${method}) error:`, err.message);
    return null;
  }
}

function formatMapLink(complaint) {
  const coords = complaint?.location?.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    const [lng, lat] = coords;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  return '';
}

async function notifyNewComplaint(complaint) {
  const chatIds = getTargetChatIds();
  if (!getBotToken() || chatIds.length === 0) return;

  const mapUrl = formatMapLink(complaint);
  const mediaUrl = complaint.beforeImages?.[0];
  const isCloudUrl = mediaUrl && /^https?:\/\//i.test(mediaUrl);
  const isVideo = complaint.beforeMedia?.[0]?.mediaType === 'video' || (mediaUrl && /\.(mp4|webm|mov)$/i.test(mediaUrl));

  const caption = [
    `🚨 *New Civic Issue Reported*`,
    `🆔 *ID:* \`${complaint.complaintId}\``,
    `📌 *Title:* ${complaint.title}`,
    `📂 *Category:* ${complaint.category}`,
    `⚡ *Severity:* ${complaint.severity || 'Medium'} | *Priority:* ${complaint.priority}/100`,
    `📍 *Address:* ${complaint.location?.address || 'N/A'}`,
    complaint.voiceTranscript ? `🎙️ *Voice Note:* "${complaint.voiceTranscript}"` : '',
    mapUrl ? `🗺️ [Open Location on Google Maps](${mapUrl})` : ''
  ].filter(Boolean).join('\n');

  for (const chatId of chatIds) {
    if (isCloudUrl && isVideo) {
      await telegramRequest('sendVideo', {
        chat_id: chatId,
        video: mediaUrl,
        caption,
        parse_mode: 'Markdown'
      });
    } else if (isCloudUrl) {
      await telegramRequest('sendPhoto', {
        chat_id: chatId,
        photo: mediaUrl,
        caption,
        parse_mode: 'Markdown'
      });
    } else {
      await telegramRequest('sendMessage', {
        chat_id: chatId,
        text: caption,
        parse_mode: 'Markdown'
      });
    }
  }
}

async function notifyDuplicateMerged(complaint, reason) {
  const chatIds = getTargetChatIds();
  if (!getBotToken() || chatIds.length === 0) return;

  const reasonLabel = reason === 'same_photo' ? 'Identical Photo Detected' : 'Same Issue Within 75m';
  const text = [
    `🔁 *Duplicate Report Merged & Counted*`,
    `🆔 *Complaint:* \`${complaint.complaintId}\` — ${complaint.title}`,
    `🔍 *Reason:* ${reasonLabel}`,
    `👥 *Total Reports / Upvotes:* ${complaint.duplicates + 1} (${complaint.upvotes} upvotes)`,
    `📈 *Updated Priority Score:* ${complaint.priority}/100`
  ].join('\n');

  for (const chatId of chatIds) {
    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    });
  }
}

async function notifyStatusUpdate(complaint, status, note) {
  const chatIds = getTargetChatIds();
  if (!getBotToken() || chatIds.length === 0) return;

  const text = [
    `🔔 *Complaint Status Updated*`,
    `🆔 *ID:* \`${complaint.complaintId}\``,
    `📌 *Title:* ${complaint.title}`,
    `✅ *New Status:* *${status}*`,
    note ? `💬 *Update:* ${note}` : ''
  ].filter(Boolean).join('\n');

  for (const chatId of chatIds) {
    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    });
  }
}

/**
 * Starts non-blocking long polling for Telegram bot commands (/start, /status, /top)
 * if TELEGRAM_BOT_TOKEN is configured in backend/.env.
 */
function startTelegramBotPolling(ComplaintModel) {
  const token = getBotToken();
  if (!token || pollingActive) return;
  pollingActive = true;
  console.log('🤖 Telegram Bot Automation active (listening for /start, /status, /top)');

  const poll = async () => {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`
      );
      if (res.ok) {
        const data = await res.json();
        for (const update of data.result || []) {
          lastUpdateId = update.update_id;
          const msg = update.message;
          if (!msg || !msg.text) continue;

          const chatId = String(msg.chat.id);
          const text = msg.text.trim();

          if (text.startsWith('/start') || text.startsWith('/help')) {
            subscribedChatIds.add(chatId);
            await telegramRequest('sendMessage', {
              chat_id: chatId,
              text: [
                `👋 *Welcome to CivicLens Municipal Bot!*`,
                `✅ This chat (\`${chatId}\`) is now subscribed to live civic issue & resolution alerts.`,
                ``,
                `*Available Commands:*`,
                `• \`/status CL-xxxx\` — Check live status of a complaint`,
                `• \`/top\` — View top 5 highest-priority open issues`
              ].join('\n'),
              parse_mode: 'Markdown'
            });
          } else if (text.startsWith('/status')) {
            const parts = text.split(/\s+/);
            const queryId = parts[1];
            if (!queryId) {
              await telegramRequest('sendMessage', {
                chat_id: chatId,
                text: 'Please provide a Complaint ID, e.g. `/status CL-2026-001`',
                parse_mode: 'Markdown'
              });
              continue;
            }
            const c = await ComplaintModel.findOne({ complaintId: queryId });
            if (!c) {
              await telegramRequest('sendMessage', {
                chat_id: chatId,
                text: `❌ Complaint \`${queryId}\` not found.`,
                parse_mode: 'Markdown'
              });
            } else {
              await telegramRequest('sendMessage', {
                chat_id: chatId,
                text: [
                  `📋 *Complaint Status: \`${c.complaintId}\`*`,
                  `📌 *Title:* ${c.title}`,
                  `🏷️ *Category:* ${c.category}`,
                  `📊 *Status:* *${c.status}*`,
                  `⚡ *Priority:* ${c.priority}/100 (${c.severity})`,
                  `🏢 *Department:* ${c.assignedTo?.department || 'Pending assignment'}`,
                  `📍 *Address:* ${c.location?.address || 'N/A'}`
                ].join('\n'),
                parse_mode: 'Markdown'
              });
            }
          } else if (text.startsWith('/top') || text.startsWith('/queue')) {
            const top = await ComplaintModel.find({ status: { $nin: ['Resolved', 'Rejected'] } })
              .sort({ priority: -1, createdAt: -1 })
              .limit(5);
            if (!top.length) {
              await telegramRequest('sendMessage', {
                chat_id: chatId,
                text: '✅ No open complaints in the priority queue!'
              });
            } else {
              const lines = top.map(
                (c, i) => `${i + 1}. *${c.title}* (\`${c.complaintId}\`)\n   Priority: *${c.priority}/100* | Status: ${c.status} | ${c.category}`
              );
              await telegramRequest('sendMessage', {
                chat_id: chatId,
                text: `🔥 *Top Priority Civic Complaints:*\n\n${lines.join('\n\n')}`,
                parse_mode: 'Markdown'
              });
            }
          }
        }
      }
    } catch {
      // ignore transient network errors
    } finally {
      setTimeout(poll, 4000);
    }
  };

  poll();
}

module.exports = {
  notifyNewComplaint,
  notifyDuplicateMerged,
  notifyStatusUpdate,
  startTelegramBotPolling,
  getTargetChatIds,
  getBotToken
};
