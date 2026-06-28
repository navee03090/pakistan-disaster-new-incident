import { execSync } from 'child_process'
import { platform } from 'os'

const port = process.argv[2] ?? process.env.PORT ?? '3000'

function freePortOnWindows(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort} | findstr LISTENING`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })

    const pids = [
      ...new Set(
        output
          .split('\n')
          .map(line => line.trim().split(/\s+/).pop())
          .filter(pid => pid && pid !== '0')
      ),
    ]

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        console.log(`Freed port ${targetPort} (stopped PID ${pid})`)
      } catch {
        // Process may have already exited.
      }
    }

    if (pids.length === 0) {
      console.log(`Port ${targetPort} is already free`)
    }
  } catch {
    console.log(`Port ${targetPort} is already free`)
  }
}

function freePortOnUnix(targetPort) {
  try {
    execSync(`lsof -ti tcp:${targetPort} | xargs -r kill -9`, {
      stdio: 'ignore',
      shell: true,
    })
    console.log(`Freed port ${targetPort}`)
  } catch {
    console.log(`Port ${targetPort} is already free`)
  }
}

if (platform() === 'win32') {
  freePortOnWindows(port)
} else {
  freePortOnUnix(port)
}
