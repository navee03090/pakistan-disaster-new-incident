import { spawn } from 'child_process'
import { execSync } from 'child_process'
import { platform } from 'os'

const port = process.env.PORT ?? '3000'

// Free the port before starting so leftover Node processes don't block dev.
execSync(`node scripts/free-port.mjs ${port}`, { stdio: 'inherit' })

const nextArgs = ['dev', '--webpack', '-p', port]
const child = spawn('next', nextArgs, {
  stdio: 'inherit',
  shell: true,
})

child.on('exit', code => process.exit(code ?? 0))
