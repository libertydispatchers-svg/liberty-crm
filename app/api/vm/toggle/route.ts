import { exec } from 'child_process';
import { NextResponse } from 'next/server';

const VALID_CODE = '64928';
const PROJECT = process.env.GCLOUD_PROJECT || 'YOUR_PROJECT_ID';
const ZONE = process.env.GCLOUD_ZONE || 'us-central1-a';
const INSTANCE = process.env.GCLOUD_INSTANCE || 'liberty-crm';
const STATE_FILE = '/tmp/vm_state.json';

function updateState(running: boolean) {
  const data = JSON.stringify({ running });
  exec(`printf '%s' '${data}' > ${STATE_FILE}`, () => {});
}

export async function POST(request: Request) {
  const { action, code } = await request.json();
  if (code !== VALID_CODE) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 403 });
  }
  if (!['start', 'stop'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  const cmd = `gcloud compute instances ${action} ${INSTANCE} --project=${PROJECT} --zone=${ZONE}`;
  return new Promise<NextResponse>((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message, stderr }, { status: 500 }));
      } else {
        const running = action === 'start';
        updateState(running);
        resolve(NextResponse.json({ success: true, running, stdout }));
      }
    });
  });
}
