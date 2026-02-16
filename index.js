require("dotenv").config();
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes
} = require("discord.js");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const UPDATE_INTERVAL = 5 * 60 * 1000;
const panelFile = "./panel.json";

// ---------- PANEL.JSON ----------
function getPanelData() {
  if (!fs.existsSync(panelFile)) return { messageId: null };
  return JSON.parse(fs.readFileSync(panelFile));
}

function savePanelData(data) {
  fs.writeFileSync(panelFile, JSON.stringify(data, null, 2));
}

// ---------- FIVEM VERİ (GÜVENLİ) ----------
async function getServerData() {
  try {
    const start = Date.now();

    const playersRes = await fetch(`http://${process.env.FIVEM_IP}/players.json`);
    const infoRes = await fetch(`http://${process.env.FIVEM_IP}/info.json`);

    const ping = Date.now() - start;

    return {
      online: true,
      players: await playersRes.json(),
      info: await infoRes.json(),
      ping
    };
  } catch (err) {
    return {
      online: false,
      players: [],
      info: {},
      ping: "—"
    };
  }
}

// ---------- EMBED (DOĞRU) ----------
async function createEmbed(players, info, ping, online) {
  const color = online ? "#00ff9c" : "#ff3b3b";

  return new EmbedBuilder()
    .setColor(color)

    // BAŞLIK
    .setTitle("YERALTI ROLEPLAY")
    .setURL("https://www.yeraltirp.com")

    // SOL ÜST LOGO
    .setAuthor({
      name: "YERALTI ROLEPLAY",
      iconURL: process.env.SERVER_LOGO
    })

    // SAĞ ÜST LOGO
    .setThumbnail(process.env.SERVER_LOGO)

    // AÇIKLAMA
.setDescription(
  `Sunucu **AKTİF**, giriş yapabilirsiniz.\n` +
  `Gerekli kuralları ve bilgi odalarını ziyaret edebilirsiniz.\n\n` +

  `**• Herhangi bir konuda destek almak için\n` +
  `•  <#${process.env.TICKET_CHANNEL_ID}>\n` +
  `• Discord davet bağlantımız\n` +
  `  ${process.env.DISCORD_INVITE}\n\n` +

  `Hızlı bağlanmak için kısayol butonlarını tercih edebilirsiniz.**`
)
    // BİLGİ KUTULARI
    .addFields(
      {
        name: "🟢 DURUM",
        value: online ? "```ONLINE```" : "```OFFLINE```",
        inline: true
      },
      {
        name: "🌐 SUNUCU IP",
        value: `\`\`\`${process.env.FIVEM_IP.split(":")[0]}\`\`\``,
        inline: true
      },
      {
        name: "👥 OYUNCULAR",
        value: online
          ? `\`\`\`${players.length} / ${info.vars?.sv_maxClients || "?"}\`\`\``
          : "```—```",
        inline: true
      },
      {
         name: "📶 PING",
         value: online ? `\`\`\`${ping} ms\`\`\`` : "```—```",
         inline: true
      }
    )

    // BANNER
    .setImage(process.env.BANNER_URL || null)

    // FOOTER
    .setFooter({
      text: "www.yeraltirp.com • Sunucu AKTİF!    BOT YAPIMCIM;  ROWN DEV ",
      iconURL: process.env.FOOTER_ICON
    })

    .setTimestamp();
}
// ---------- PANEL GÜNCELLE ----------
async function updatePanel(forceCreate = false) {
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  if (!channel) return;

  const { players, info, ping, online } = await getServerData();
  const embed = await createEmbed(players, info, ping, online);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🎮 FiveM Bağlan")
      .setStyle(ButtonStyle.Link)
      .setURL(process.env.FIVEM_JOIN)
  );

  const data = getPanelData();

  if (data.messageId && !forceCreate) {
    try {
      const msg = await channel.messages.fetch(data.messageId);
      return msg.edit({ embeds: [embed], components: [row] });
    } catch {}
  }

  const msg = await channel.send({ embeds: [embed], components: [row] });
  savePanelData({ messageId: msg.id });
}

// ---------- SLASH KOMUT ----------
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

async function registerCommands() {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    {
      body: [
        {
          name: "panel-kur",
          description: "FiveM panelini kur / yenile (Sahip)"
        }
      ]
    }
  );
}

// ---------- EVENTLER ----------
client.once("ready", async () => {
  console.log("✅ PRO PANEL BOT AKTİF");
  await registerCommands();
  await updatePanel();
  setInterval(updatePanel, UPDATE_INTERVAL);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "panel-kur") {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: "❌ Yetkin yok", ephemeral: true });
    }

    await updatePanel(true);
    return interaction.reply({
      content: "✅ Panel kuruldu / yenilendi",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
