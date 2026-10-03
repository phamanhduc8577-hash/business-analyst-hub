import { spawn } from 'child_process';
import path from 'path';

console.log('🧪 Testing BA Hub MCP Server (STDIO JSON-RPC 2.0)...\n');

const serverProcess = spawn('node', [path.join(process.cwd(), 'mcp-server/index.js')], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let testPassed = 0;
let testFailed = 0;

function sendRpc(msg) {
  serverProcess.stdin.write(JSON.stringify(msg) + '\n');
}

serverProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const resp = JSON.parse(line);

      if (resp.id === 1) {
        if (resp.result.tools && resp.result.tools.length >= 3) {
          console.log('  ✅ PASS: tools/list returned 3 MCP tools');
          testPassed++;
        } else {
          console.error('  ❌ FAIL: tools/list incomplete');
          testFailed++;
        }
        // Test 2: Call validate_ears_requirement
        sendRpc({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'validate_ears_requirement',
            arguments: { requirementText: 'WHEN user clicks submit, THE SYSTEM SHALL save record' }
          }
        });
      }

      if (resp.id === 2) {
        const text = resp.result.content[0].text;
        const parsed = JSON.parse(text);
        if (parsed.isValidEARS === true) {
          console.log('  ✅ PASS: validate_ears_requirement detected valid EARS syntax');
          testPassed++;
        } else {
          console.error('  ❌ FAIL: validate_ears_requirement failed');
          testFailed++;
        }

        // Test 3: Call get_ba_template
        sendRpc({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'get_ba_template',
            arguments: { templateType: 'iso20022_payments' }
          }
        });
      }

      if (resp.id === 3) {
        const content = resp.result.content[0].text;
        if (content.includes('pacs.008') && content.includes('ISO 20022')) {
          console.log('  ✅ PASS: get_ba_template loaded ISO 20022 guide correctly');
          testPassed++;
        } else {
          console.error('  ❌ FAIL: get_ba_template content mismatch');
          testFailed++;
        }

        serverProcess.kill();
        console.log(`\n🎉 MCP Server Test Summary: ${testPassed} Passed, ${testFailed} Failed.\n`);
        process.exit(testFailed > 0 ? 1 : 0);
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
  }
});

// Start testing
sendRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
