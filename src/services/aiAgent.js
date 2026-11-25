import {
  STORAGE_KEYS,
  getSetting,
  DEFAULT_SYSTEM_PROMPT
} from './localDb';
import * as gmail from './gmailApi';

// Tool Declarations in OpenAPI / Gemini JSON schema format
export const AGENT_TOOLS_GEMINI = [
  {
    name: 'list_emails',
    description: 'Search and list emails in Gmail using search query syntax (e.g., "is:unread", "from:boss", "newer_than:2d"). Returns summaries with Subject, From, Date, and Snippet.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Gmail search query string, e.g., "is:unread", "newer_than:1d", "category:promotions". Default is "is:unread".'
        },
        maxResults: {
          type: 'INTEGER',
          description: 'Maximum number of emails to retrieve (1 to 25). Default is 10.'
        },
        includeSpamTrash: {
          type: 'BOOLEAN',
          description: 'Set to true when searching SPAM or TRASH folders.'
        }
      },
      required: []
    }
  },
  {
    name: 'get_email_thread',
    description: 'Fetch the full decoded email thread content by threadId, including all messages, sender details, and full body text.',
    parameters: {
      type: 'OBJECT',
      properties: {
        threadId: {
          type: 'STRING',
          description: 'The Gmail thread ID to fetch full messages for.'
        }
      },
      required: ['threadId']
    }
  },
  {
    name: 'summarize_inbox',
    description: 'Batch-fetches recent emails matching a filter to generate a structured executive summary with priority tags and action items.',
    parameters: {
      type: 'OBJECT',
      properties: {
        filter: {
          type: 'STRING',
          description: 'Filter query (default "is:unread").'
        },
        count: {
          type: 'INTEGER',
          description: 'Number of emails to inspect (default 10).'
        }
      },
      required: []
    }
  },
  {
    name: 'create_draft',
    description: 'Creates a real email draft inside the user\'s Gmail account. Safe to run autonomously because it does not send the email.',
    parameters: {
      type: 'OBJECT',
      properties: {
        to: {
          type: 'STRING',
          description: 'Recipient email address.'
        },
        subject: {
          type: 'STRING',
          description: 'Subject line of the email.'
        },
        body: {
          type: 'STRING',
          description: 'Plain text email body content.'
        },
        threadId: {
          type: 'STRING',
          description: 'Optional threadId if this is a reply to an existing email thread.'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'propose_send_email',
    description: 'Proposes sending an email or draft. In interactive UI mode, this triggers a confirmation card for the user to approve before sending.',
    parameters: {
      type: 'OBJECT',
      properties: {
        to: {
          type: 'STRING',
          description: 'Recipient email address.'
        },
        subject: {
          type: 'STRING',
          description: 'Subject line of the email.'
        },
        body: {
          type: 'STRING',
          description: 'Full text body of the email to send.'
        },
        threadId: {
          type: 'STRING',
          description: 'Optional threadId if replying in an existing thread.'
        },
        draftId: {
          type: 'STRING',
          description: 'Optional draftId if sending an already created draft.'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'manage_labels',
    description: 'Archive emails, mark as read, or modify Gmail labels on a message.',
    parameters: {
      type: 'OBJECT',
      properties: {
        messageId: {
          type: 'STRING',
          description: 'The Gmail message ID to update.'
        },
        addLabels: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Labels to add (e.g., ["STARRED"]).'
        },
        removeLabels: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Labels to remove (e.g., ["UNREAD"] to mark as read, or ["INBOX"] to archive).'
        }
      },
      required: ['messageId']
    }
  },
  {
    name: 'trash_emails',
    description: 'Move emails to Trash in bulk by messageIds or a Gmail search query (e.g., "from:newsletter@example.com", "in:spam").',
    parameters: {
      type: 'OBJECT',
      properties: {
        messageIds: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Optional array of Gmail message IDs to move to Trash.'
        },
        query: {
          type: 'STRING',
          description: 'Optional Gmail search query to match emails to move to Trash (e.g., "category:promotions older_than:30d").'
        }
      },
      required: []
    }
  },
  {
    name: 'delete_emails',
    description: 'Delete emails permanently (or move to Trash if full Gmail scope is not enabled) by messageIds or Gmail search query.',
    parameters: {
      type: 'OBJECT',
      properties: {
        messageIds: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Optional array of Gmail message IDs to delete.'
        },
        query: {
          type: 'STRING',
          description: 'Optional Gmail search query to match emails to delete.'
        },
        permanent: {
          type: 'BOOLEAN',
          description: 'True to permanently delete immediately (default true), false to move to Trash.'
        }
      },
      required: []
    }
  },
  {
    name: 'empty_spam',
    description: 'Empty the entire Gmail SPAM folder (fetches all SPAM emails with pagination and deletes them permanently, or moves them to Trash if only gmail.modify scope is enabled).',
    parameters: {
      type: 'OBJECT',
      properties: {
        permanent: {
          type: 'BOOLEAN',
          description: 'True to permanently delete all SPAM emails (default true), false to move to Trash.'
        }
      },
      required: []
    }
  }
];

// Map OpenAI format tools
export const AGENT_TOOLS_OPENAI = AGENT_TOOLS_GEMINI.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([k, v]) => [
          k,
          {
            type: v.type.toLowerCase(),
            description: v.description,
            ...(v.items ? { items: { type: v.items.type.toLowerCase() } } : {})
          }
        ])
      ),
      required: tool.parameters.required || []
    }
  }
}));

// Execute tool locally in browser
async function executeLocalTool(toolName, args, { isHeadless = false } = {}) {
  switch (toolName) {
    case 'list_emails':
      return await gmail.list_emails(
        args.query || 'is:unread',
        args.maxResults || 10,
        Boolean(args.includeSpamTrash)
      );

    case 'get_email_thread':
      return await gmail.get_email_thread(args.threadId);

    case 'summarize_inbox':
      return await gmail.summarize_inbox(args.filter || 'is:unread', args.count || 10);

    case 'create_draft':
      return await gmail.create_draft(args.to, args.subject, args.body, args.threadId || null);

    case 'propose_send_email':
      if (isHeadless && getSetting(STORAGE_KEYS.AUTO_SEND_HEADLESS, false)) {
        // In headless mode with explicit auto-send permission:
        return await gmail.send_email({
          to: args.to,
          subject: args.subject,
          body: args.body,
          threadId: args.threadId || null,
          draftId: args.draftId || null
        });
      }
      // Interactive mode: create draft and request UI approval
      const draftResult = await gmail.create_draft(args.to, args.subject, args.body, args.threadId || null);
      return {
        actionRequired: 'CONFIRM_SEND',
        draftId: draftResult.draftId,
        to: args.to,
        subject: args.subject,
        body: args.body,
        threadId: args.threadId,
        message: 'Draft created in Gmail. User approval required to send.'
      };

    case 'manage_labels':
      return await gmail.manage_labels(args.messageId, args.addLabels || [], args.removeLabels || []);

    case 'trash_emails':
      return await gmail.trash_emails({
        messageIds: args.messageIds || [],
        query: args.query || ''
      });

    case 'delete_emails':
      return await gmail.delete_emails({
        messageIds: args.messageIds || [],
        query: args.query || '',
        permanent: args.permanent !== false
      });

    case 'empty_spam':
      return await gmail.empty_spam({
        permanent: args.permanent !== false
      });

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ==========================================
// GEMINI API CALL HANDLER
// ==========================================
async function callGemini({ apiKey, model, contents, systemInstruction }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents,
    tools: [{ functionDeclarations: AGENT_TOOLS_GEMINI }],
    ...(systemInstruction ? {
      systemInstruction: {
        role: 'user',
        parts: [{ text: systemInstruction }]
      }
    } : {}),
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errBody = '';
    try {
      const j = await res.json();
      errBody = j.error?.message || JSON.stringify(j);
    } catch {
      errBody = res.statusText;
    }
    throw new Error(`Gemini API Error (${res.status}): ${errBody}`);
  }

  return await res.json();
}

// ==========================================
// OPENAI-COMPATIBLE CALL HANDLER
// ==========================================
async function callOpenAI({ apiKey, model, endpoint, messages, systemInstruction }) {
  const baseUrl = endpoint ? endpoint.replace(/\/+$/, '') : 'https://api.openai.com/v1';
  const url = `${baseUrl}/chat/completions`;

  const formattedMessages = [
    ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
    ...messages
  ];

  const payload = {
    model: model || 'gpt-4o-mini',
    messages: formattedMessages,
    tools: AGENT_TOOLS_OPENAI,
    tool_choice: 'auto',
    temperature: 0.2,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errBody = '';
    try {
      const j = await res.json();
      errBody = j.error?.message || JSON.stringify(j);
    } catch {
      errBody = res.statusText;
    }
    throw new Error(`OpenAI API Error (${res.status}): ${errBody}`);
  }

  return await res.json();
}

function buildFallbackSummary(executedTools) {
  if (!executedTools || executedTools.length === 0) {
    return 'Tiada tindakan dilaksanakan kerana AI tidak memulangkan jawapan atau mencapai had langkah.';
  }
  const lines = executedTools.map((t) => {
    if (t.error) {
      return `- ❌ **${t.tool}**: ${t.error}`;
    }
    const msg = t.result?.message || (t.result?.count !== undefined ? `${t.result.count} item(s)` : 'OK');
    return `- ✅ **${t.tool}**: ${msg}`;
  });
  return `Ringkasan pelaksanaan alat:\n${lines.join('\n')}`;
}

// ==========================================
// MAIN AGENT RUNNER LOOP
// ==========================================
export async function runAgentWorkflow({
  userPrompt,
  history = [],
  onStepUpdate = () => {},
  isHeadless = false
}) {
  const provider = getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini');
  const apiKey = getSetting(STORAGE_KEYS.AI_API_KEY, '');
  const model = getSetting(STORAGE_KEYS.AI_MODEL, provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
  const customEndpoint = getSetting(STORAGE_KEYS.AI_ENDPOINT, '');
  const systemInstruction = getSetting(STORAGE_KEYS.AI_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT);

  if (!apiKey) {
    throw new Error(`AI API Key is missing. Please configure your ${provider.toUpperCase()} API key in settings.`);
  }

  onStepUpdate({ type: 'start', message: `Initializing agent with ${provider} (${model})...` });

  let actionCards = [];

  // ----------------------------------------
  // Branch A: GOOGLE GEMINI PROVIDER
  // ----------------------------------------
  if (provider === 'gemini') {
    // Build Gemini contents format
    const contents = [];

    // Prior conversation history
    for (const msg of history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // New user prompt
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    let maxTurns = 10;
    let turn = 0;
    let finalAnswer = '';
    const executedTools = [];

    while (turn < maxTurns) {
      turn++;
      onStepUpdate({ type: 'thinking', message: turn === 1 ? 'Analyzing inbox and determining actions...' : 'Processing tool results...' });

      const response = await callGemini({ apiKey, model, contents, systemInstruction });
      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content) {
        throw new Error('Gemini returned an empty response.');
      }

      const modelParts = candidate.content.parts || [];
      // Push model's turn into conversation memory
      contents.push(candidate.content);

      // Check if model called function(s)
      const functionCalls = modelParts.filter(p => p.functionCall);

      if (functionCalls.length === 0) {
        // No function calls, we have the final answer text
        finalAnswer = modelParts.map(p => p.text || '').join('\n').trim();
        break;
      }

      // Execute each function call locally
      const responseParts = [];

      for (const fc of functionCalls) {
        const call = fc.functionCall;
        const toolName = call.name;
        const args = call.args || {};

        onStepUpdate({
          type: 'tool_call',
          tool: toolName,
          args,
          message: `Executing ${toolName}...`
        });

        try {
          const toolResult = await executeLocalTool(toolName, args, { isHeadless });

          if (toolResult?.actionRequired === 'CONFIRM_SEND') {
            actionCards.push({
              type: 'CONFIRM_SEND',
              ...toolResult
            });
          } else if (toolName === 'create_draft' && toolResult.success) {
            actionCards.push({
              type: 'DRAFT_CREATED',
              ...toolResult
            });
          }

          responseParts.push({
            functionResponse: {
              name: toolName,
              response: { result: toolResult }
            }
          });
          executedTools.push({ tool: toolName, result: toolResult });

          onStepUpdate({
            type: 'tool_result',
            tool: toolName,
            result: toolResult,
            message: `Completed ${toolName}`
          });
        } catch (toolErr) {
          console.error(`Tool ${toolName} execution error:`, toolErr);
          responseParts.push({
            functionResponse: {
              name: toolName,
              response: { error: toolErr.message }
            }
          });
          executedTools.push({ tool: toolName, error: toolErr.message });
          onStepUpdate({
            type: 'tool_error',
            tool: toolName,
            error: toolErr.message,
            message: `Error in ${toolName}: ${toolErr.message}`
          });
        }
      }

      // Feed function responses back into Gemini
      contents.push({
        role: 'user',
        parts: responseParts
      });
    }

    onStepUpdate({ type: 'done', message: 'Task complete.' });
    return {
      content: finalAnswer || buildFallbackSummary(executedTools),
      actionCards
    };
  }

  // ----------------------------------------
  // Branch B: OPENAI / OPENROUTER PROVIDER
  // ----------------------------------------
  else {
    const messages = [];

    for (const msg of history) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    messages.push({ role: 'user', content: userPrompt });

    let maxTurns = 10;
    let turn = 0;
    let finalAnswer = '';
    const executedTools = [];

    while (turn < maxTurns) {
      turn++;
      onStepUpdate({ type: 'thinking', message: 'Analyzing inbox and determining actions...' });

      const response = await callOpenAI({
        apiKey,
        model,
        endpoint: customEndpoint,
        messages,
        systemInstruction
      });

      const choice = response.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error('OpenAI returned an empty response.');
      }

      const msg = choice.message;
      messages.push(msg);

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalAnswer = msg.content || '';
        break;
      }

      // Execute tool calls
      for (const tc of msg.tool_calls) {
        const toolName = tc.function.name;
        let args = {};
        try {
          args = JSON.parse(tc.function.arguments || '{}');
        } catch (e) {
          args = {};
        }

        onStepUpdate({
          type: 'tool_call',
          tool: toolName,
          args,
          message: `Executing ${toolName}...`
        });

        try {
          const toolResult = await executeLocalTool(toolName, args, { isHeadless });

          if (toolResult?.actionRequired === 'CONFIRM_SEND') {
            actionCards.push({
              type: 'CONFIRM_SEND',
              ...toolResult
            });
          } else if (toolName === 'create_draft' && toolResult.success) {
            actionCards.push({
              type: 'DRAFT_CREATED',
              ...toolResult
            });
          }

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(toolResult)
          });
          executedTools.push({ tool: toolName, result: toolResult });

          onStepUpdate({
            type: 'tool_result',
            tool: toolName,
            result: toolResult,
            message: `Completed ${toolName}`
          });
        } catch (toolErr) {
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({ error: toolErr.message })
          });
          executedTools.push({ tool: toolName, error: toolErr.message });
          onStepUpdate({
            type: 'tool_error',
            tool: toolName,
            error: toolErr.message,
            message: `Error in ${toolName}: ${toolErr.message}`
          });
        }
      }
    }

    onStepUpdate({ type: 'done', message: 'Task complete.' });
    return {
      content: finalAnswer || buildFallbackSummary(executedTools),
      actionCards
    };
  }
}
