import {spawn} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const childEnv = {
  ...process.env,
  APP_ORIGIN: 'http://localhost:5173',
  PORT: '3000',
};

const backend = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: childEnv,
  stdio: 'inherit',
});

const frontend = spawn(
  process.execPath,
  [join(root, 'node_modules', 'vite', 'bin', 'vite.js')],
  {cwd: root, env: childEnv, stdio: 'inherit'},
);

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (!backend.killed) backend.kill();
  if (!frontend.killed) frontend.kill();
  setTimeout(() => process.exit(exitCode), 100);
}

backend.on('error', (error) => {
  console.error(`Backend ishga tushmadi: ${error.message}`);
  stop(1);
});
frontend.on('error', (error) => {
  console.error(`Vite ishga tushmadi: ${error.message}`);
  stop(1);
});
backend.on('exit', (code, signal) => {
  if (!stopping) {
    console.error(`Backend to‘xtadi (${signal || code}).`);
    stop(code || 1);
  }
});
frontend.on('exit', (code, signal) => {
  if (!stopping) {
    console.error(`Vite to‘xtadi (${signal || code}).`);
    stop(code || 1);
  }
});

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
