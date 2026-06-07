import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(express.json());

const repoRoot = path.resolve(__dirname, '..', '..');

function runDotnet(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('dotnet', ['run', '--project', path.join(repoRoot, 'AllsvenskanScraper'), '--', ...args], {
      cwd: repoRoot,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `Exit code ${code}`));
    });

    proc.on('error', reject);

    setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout'));
    }, 120000);
  });
}

function parseDraftOutput(output: string) {
  const lines = output.split('\n').map((l) => l.trim()).filter(Boolean);

  const num = (s: string) => parseFloat(s.replace(',', '.'));

  const minL = lines.find((l) => l.startsWith('Min'));
  const medelL = lines.find((l) => l.startsWith('Medel'));
  const p75L = lines.find((l) => l.startsWith('P75'));
  const pctL = lines.find((l) => l.startsWith('≥86'));

  const parseLine = (line: string) => {
    const parts = line.split(/\s{2,}/);
    const map: Record<string, number> = {};
    for (const p of parts) {
      const m = p.match(/^([A-Za-z0-9]+)\s*:\s*([\d,.]+)/);
      if (m) map[m[1]] = num(m[2]);
    }
    return map;
  };

  const minMap = parseLine(minL || '');
  const medelMap = parseLine(medelL || '');
  const p75Map = parseLine(p75L || '');

  const thresholds: { threshold: number; pct: number }[] = [];
  for (const line of lines) {
    const m = line.match(/^≥?(\d+):\s*([\d,.]+)%/);
    if (m) thresholds.push({ threshold: parseInt(m[1]), pct: num(m[2]) });
  }

  const p86 = thresholds.find((t) => t.threshold === 86)?.pct ?? 0;
  const p87 = thresholds.find((t) => t.threshold === 87)?.pct ?? 0;
  const p88 = thresholds.find((t) => t.threshold === 88)?.pct ?? 0;
  const p89 = thresholds.find((t) => t.threshold === 89)?.pct ?? 0;

  return {
    min: minMap['Min'] ?? 0,
    p10: minMap['P10'] ?? 0,
    p25: minMap['P25'] ?? 0,
    median: medelMap['Median'] ?? 0,
    avg: medelMap['Medel'] ?? 0,
    p75: p75Map['P75'] ?? 0,
    p90: p75Map['P90'] ?? 0,
    p95: p75Map['P95'] ?? 0,
    p99: p75Map['P99'] ?? 0,
    max: p75Map['Max'] ?? 0,
    p86, p87, p88, p89,
    thresholds,
  };
}

function parseBatchOutput(output: string) {
  const lines = output.split('\n').map((l) => l.trim()).filter(Boolean);

  const ovrLine = lines.find((l) => l.startsWith('OVR'));
  const bestLine = lines.find((l) => l.startsWith('Bästa'));
  const leastLine = lines.find((l) => l.startsWith('Minst'));

  const ovrM = ovrLine?.match(/OVR\s+([\d.]+)\s*\|/);
  const simsM = ovrLine?.match(/\|\s*(\d+)\s*sims/);
  const undefM = ovrLine?.match(/Obesegrade:\s*(\d+)\/(\d+)\s*\(([\d.]+)%\)/);

  const bestM = bestLine?.match(/(\d+)-(\d+)-(\d+)/);
  const bestPts = bestLine?.match(/\|\s*(\d+)p/);
  const bestGd = bestLine?.match(/\+?(-?\d+)GD/);

  const leastM = leastLine?.match(/(\d+)-(\d+)-(\d+)/);
  const leastPts = leastLine?.match(/\|\s*(\d+)p/);

  return {
    ovr: ovrM ? parseFloat(ovrM[1]) : 0,
    totalSims: simsM ? parseInt(simsM[1]) : 0,
    undefeated: undefM ? parseInt(undefM[1]) : 0,
    undefeatedPct: undefM ? parseFloat(undefM[3]) : 0,
    bestWins: bestM ? parseInt(bestM[1]) : 0,
    bestDraws: bestM ? parseInt(bestM[2]) : 0,
    bestLosses: bestM ? parseInt(bestM[3]) : 0,
    bestPoints: bestPts ? parseInt(bestPts[1]) : 0,
    bestGd: bestGd ? parseInt(bestGd[1]) : 0,
    leastLossWins: leastM ? parseInt(leastM[1]) : 0,
    leastLossDraws: leastM ? parseInt(leastM[2]) : 0,
    leastLossLosses: leastM ? parseInt(leastM[3]) : 0,
    leastLossPoints: leastPts ? parseInt(leastPts[1]) : 0,
  };
}

function parseSimulateOutput(output: string) {
  const lines = output.split('\n').map((l) => l.trim()).filter(Boolean);

  const ovrM = output.match(/Overall\s+([\d.]+)/);
  const attM = output.match(/ATT\s+([\d.]+)\s+MID\s+([\d.]+)\s+DEF\s+([\d.]+)\s+GK\s+([\d.]+)/);
  const recordM = output.match(/(\d+)-(\d+)-(\d+)\s*\|/);
  const ptsM = output.match(/\|\s*(\d+)\s*pts/);
  const gfM = output.match(/(\d+)\s*GF/);
  const gaM = output.match(/(\d+)\s*GA/);

  const slotRegex = /^\s{2}(GK|LB|CB1|CB2|CB3|RB|LM|CM1|CM2|CM3|RM|LW|ST|ST1|ST2|RW)\s+(.+?)\s+\((.+?)\)\s+([\d.]+)/gm;

  const slots: Record<string, { name: string; team: string; season: number; ovr: number }> = {};
  let slotMatch;
  while ((slotMatch = slotRegex.exec(output)) !== null) {
    const teamSeason = slotMatch[3].match(/(.+)\s+(\d{4})/);
    slots[slotMatch[1]] = {
      name: slotMatch[2],
      team: teamSeason?.[1] ?? '',
      season: teamSeason ? parseInt(teamSeason[2]) : 0,
      ovr: parseFloat(slotMatch[4]),
    };
  }

  const wins = recordM ? parseInt(recordM[1]) : 0;
  const draws = recordM ? parseInt(recordM[2]) : 0;
  const losses = recordM ? parseInt(recordM[3]) : 0;
  const points = ptsM ? parseInt(ptsM[1]) : 0;
  const goalsFor = gfM ? parseInt(gfM[1]) : 0;
  const goalsAgainst = gaM ? parseInt(gaM[1]) : 0;

  return {
    team: {
      name: 'Dream Team',
      slots,
      formation: '4-4-2',
      attack: attM ? parseFloat(attM[1]) : 0,
      midfield: attM ? parseFloat(attM[2]) : 0,
      defence: attM ? parseFloat(attM[3]) : 0,
      gkRating: attM ? parseFloat(attM[4]) : 0,
      overall: ovrM ? parseFloat(ovrM[1]) : 0,
    },
    season: {
      wins, draws, losses, points, goalsFor, goalsAgainst,
      gd: goalsFor - goalsAgainst,
    },
    position: 1,
    expectedPosition: 1,
  };
}

app.post('/api/draft', async (req, res) => {
  try {
    const { formation, nSims, nRerolls, mode } = req.body;
    const output = await runDotnet(['draft', formation || '4-4-2', String(nSims || 10000), String(nRerolls || 0), mode || 'season']);
    const result = parseDraftOutput(output);
    res.json(result);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.post('/api/batch', async (req, res) => {
  try {
    const { formation, nSims, targetOvr } = req.body;
    const args = ['batch', formation || '4-4-2', String(nSims || 10000)];
    if (targetOvr) args.push(String(targetOvr));
    const output = await runDotnet(args);
    const result = parseBatchOutput(output);
    res.json(result);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.post('/api/simulate', async (req, res) => {
  try {
    const { formation } = req.body;
    const output = await runDotnet(['simulate', formation || '4-4-2']);
    const result = parseSimulateOutput(output);
    res.json(result);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.get('/api/players/count', async (_req, res) => {
  try {
    const dataDir = path.join(repoRoot, 'data', 'game', 'players.json');
    const fs = await import('fs');
    if (fs.existsSync(dataDir)) {
      const raw = fs.readFileSync(dataDir, 'utf-8');
      const players = JSON.parse(raw);
      res.json({ count: players.length });
    } else {
      res.json({ count: 0 });
    }
  } catch {
    res.json({ count: 0 });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
