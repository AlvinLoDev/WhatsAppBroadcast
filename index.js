const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

const sessionDir = path.join(__dirname, "session");
const nomorPath = path.join(__dirname, "numbers.txt");
const logPath = path.join(__dirname, "broadcast.log");
const defaultNomorList = [
    "87855212057",
    "82144011410",
    "85883686051",
    "83124443366",
    "81347480223"
];

function writeLog(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `${timestamp} - ${message}\n`, "utf8");
}

function normalizeNomor(value) {
    if (!value) return null;

    const cleaned = value.toString().replace(/\D/g, "");
    if (!cleaned) return null;

    let nomor = cleaned;

    if (nomor.startsWith("0")) {
        nomor = "62" + nomor.substring(1);
    }

    if (!nomor.startsWith("62")) {
        nomor = "62" + nomor;
    }

    return nomor;
}

function loadNomorList() {
    try {
        const content = fs.readFileSync(nomorPath, "utf8");
        const list = content
            .split(/\r?\n|,/) 
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"))
            .map(normalizeNomor)
            .filter(Boolean);

        if (list.length > 0) return [...new Set(list)];
    } catch (error) {
        console.log("File numbers.txt tidak ditemukan. Menggunakan daftar default.");
    }

    const fallbackList = defaultNomorList
        .map(normalizeNomor)
        .filter(Boolean);

    if (fallbackList.length > 0) return [...new Set(fallbackList)];

    return ["628979728413"];
}

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "broadcast-session",
        dataPath: sessionDir
    }),
    puppeteer: {
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

client.on("qr", (qr) => {
    console.log("Scan QR ini dengan WhatsApp:");
    qrcode.generate(qr, { small: true });
    writeLog("QR ditampilkan");
});

client.on("ready", async () => {
    console.log("WhatsApp sudah terhubung!");
    writeLog("WhatsApp terhubung");

    const nomorList = loadNomorList();

    if (!nomorList.length) {
        console.log("Tidak ada nomor yang valid untuk dikirim.");
        return;
    }

    console.log("Jumlah nomor yang akan dikirim:", nomorList.length);

    const pesan = `Peringatan Terakhir Tagihan Indodana/Blibli/Tiket.com Anda.

Kami memberikan kesempatan terakhir sebelum Tim Lapangan (FC) dijadwalkan ke alamat Anda dan penutupan program bantu potongan denda 75%.

Konfirmasi kendala Anda ke Admin sebelum jam 17.00 WIB:

📲 Hubungi Admin Sekarang:
 👉6288985254513
 👉6288985254513
 👉6288985254513
(Khusus konfirmasi pembayaran , keringanan denda & Informasi Kendala )

Jangan Abaikan Pesan Ini Begitu saja jika memang anda masih punya itikad baik sama tagihan anda`;

    const batchSize = 5;
    const minDelay = 15000;
    const maxDelay = 30000;
    const maxFailures = 3;
    const retryLimit = 2;
    const sentNumbers = new Set();
    let failureCount = 0;

    async function sendWithRetry(nomor, text, limit = retryLimit) {
        let lastError;

        for (let attempt = 1; attempt <= limit + 1; attempt++) {
            try {
                const chatId = `${nomor}@c.us`;
                await client.sendMessage(chatId, text);
                return;
            } catch (error) {
                lastError = error;

                if (attempt <= limit) {
                    const waitTime = 15000 * attempt;
                    console.log(`Retry ${nomor} (${attempt}/${limit}) dalam ${waitTime / 1000} detik...`);
                    await delay(waitTime);
                }
            }
        }

        throw lastError;
    }

    for (let i = 0; i < nomorList.length; i += batchSize) {
        const batch = nomorList.slice(i, i + batchSize);
        console.log(`\n=== Batch ${Math.floor(i / batchSize) + 1} (${batch.length} nomor) ===`);

        for (const nomor of batch) {
            if (sentNumbers.has(nomor)) {
                continue;
            }

            try {
                await sendWithRetry(nomor, pesan, retryLimit);
                sentNumbers.add(nomor);
                console.log("Terkirim:", nomor);
                writeLog(`Terkirim: ${nomor}`);
                failureCount = 0;
            } catch (err) {
                failureCount++;
                console.log("Gagal:", nomor, err.message);
                writeLog(`Gagal: ${nomor} - ${err.message}`);

                if (failureCount >= maxFailures) {
                    console.log("Banyak gagal berturut-turut. Menghentikan pengiriman agar lebih aman.");
                    writeLog("Pengiriman dihentikan karena terlalu banyak gagal.");
                    return;
                }
            }

            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            await delay(randomDelay);
        }

        if (i + batchSize < nomorList.length) {
            console.log("Menunggu batch berikutnya...");
            await delay(60000);
        }
    }

    console.log("Selesai");
    writeLog("Semua batch selesai");
});

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

client.initialize();