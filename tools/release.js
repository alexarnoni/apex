import { spawnSync } from 'node:child_process';

for (const task of ['test', 'balance', 'build', 'test:ui']) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', task], {
    stdio: 'inherit',
    env: { ...process.env, BANDEIRADA_TEST_PREBUILT: '1' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
