
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        cb(null, `pcp-import-${timestamp}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Rota raiz informativa (evita o "Cannot GET /")
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #4f46e5;">🚀 Servidor PCP Online</h1>
            <p>Este é o backend de processamento (Porta 3001).</p>
            <p style="font-weight: bold; font-size: 1.2em;">Para ver a interface visual, acesse: 
                <a href="http://localhost:5173" style="color: #4f46e5;">http://localhost:5173</a>
            </p>
            <div style="margin-top: 20px; color: #64748b; font-size: 0.9em;">
                Status da API: <span style="color: #10b981;">OPERACIONAL</span>
            </div>
        </div>
    `);
});

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        service: 'PCP Engine Localhost', 
        storage: uploadDir,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/upload', upload.single('csvFile'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
        console.log(`[PCP SERVER] ✅ Arquivo persistido em: ${req.file.path}`);
        res.json({ 
            success: true, 
            filename: req.file.filename,
            path: req.file.path 
        });
    } catch (err) {
        console.error('[PCP SERVER] ❌ Erro no upload:', err);
        res.status(500).json({ error: err.message });
    }
});

const server = app.listen(port, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 SERVIDOR PCP (BACKEND) ONLINE: http://localhost:${port}`);
    console.log(`💻 INTERFACE DO USUÁRIO (FRONTEND): http://localhost:5173`);
    console.log(`📁 DESTINO DE UPLOADS: ${uploadDir}`);
    console.log(`=========================================\n`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`[PCP SERVER] Porta ${port} já em uso.`);
    } else {
        console.error('[PCP SERVER] Erro fatal:', err);
    }
});
