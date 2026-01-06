const axios = require('axios');

function getPriorityColor(priority) {
  switch (priority.toLowerCase()) {
    case "high":
      return 16711680; // Red
    case "medium":
      return 16753920; // Orange
    case "low":
      return 65280; // Green
    default:
      return 8421504; // Grey
  }
}

async function sendWebhookNotification(webhook, message) {
  if (!webhook.active) return;

  const url = webhook.url;

  if (url.includes("discord.com")) {
    const discordMessage = {
      embeds: [
        {
          title: "Issue Created",
          description: "A new issue has been created",
          color: getPriorityColor(message.priority),
          footer: {
            text: "Issue ID: " + message.id,
          },
          author: {
            name: "peppermint.sh",
            icon_url: "https://avatars.githubusercontent.com/u/76014454?s=200&v=4",
            url: "https://peppermint.sh/",
          },
          fields: [
            {
              name: "Title",
              value: message.title,
              inline: false,
            },
            {
              name: "Priority Level",
              value: message.priority,
              inline: false,
            },
            {
              name: "Contact Email",
              value: message.email ? message.email : "No email provided",
              inline: false,
            },
            {
              name: "Created By",
              value: message.createdBy?.name || 'Unknown',
              inline: false,
            },
            {
              name: "Assigned To",
              value: message.assignedTo
                ? message.assignedTo.name
                : "Unassigned",
              inline: false,
            },
            {
              name: "Client",
              value: message.client
                ? message.client.name
                : "No client assigned",
              inline: false,
            },
            {
              name: "Type",
              value: message.type || 'Issue',
              inline: false,
            },
          ],
        },
      ],
      content: "",
    };

    try {
      await axios.post(url, discordMessage);
      console.log("Discord webhook message sent successfully!");
    } catch (error) {
      if (error.response) {
        console.error("Discord API response error:", error.response.data);
      } else {
        console.error("Error sending Discord webhook:", error.message);
      }
      throw error;
    }
  } else {
    try {
      // For custom webhooks, send the message data with optional signature
      const payload = {
        data: message,
        timestamp: new Date().toISOString(),
        event: 'issue_created'
      };

      const config = {};
      
      // Add signature if secret is provided
      if (webhook.secret) {
        // You might want to add HMAC signature here
        // const signature = createHmac('sha256', webhook.secret).update(JSON.stringify(payload)).digest('hex');
        // config.headers = { 'X-Signature': signature };
      }

      await axios.post(url, payload, config);
      console.log("Custom webhook message sent successfully!");
    } catch (error) {
      console.error("Error sending custom webhook:", error.message);
      throw error;
    }
  }
}

module.exports = {
  getPriorityColor,
  sendWebhookNotification
};