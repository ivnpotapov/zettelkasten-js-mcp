/**
 * Integration test script for Zettelkasten MCP server
 * Tests all MCP capabilities via stdin/stdout communication
 */

import { spawn, type ChildProcess } from "child_process";

import {
  createLink,
  createNote,
  nextId,
  sendRequest,
  type McpResponse,
  type TestNote,
} from "./utils/index.js";

const testNotes: TestNote[] = [
  {
    title: "Искусственный интеллект: обзор",
    content:
      "Искусственный интеллект (ИИ) — это область информатики, занимающаяся созданием интеллектуальных систем. Включает машинное обучение, нейронные сети, обработку естественного языка и компьютерное зрение.",
    tags: ["ии", "обзор", "введение"],
  },
  {
    title: "Нейронные сети",
    content:
      "Нейронные сети — вычислительные модели, вдохновлённые структурой мозга. Состоят из слоёв interconnected нейронов. Применяются в распознавании образов, классификации, прогнозировании и генерации.",
    tags: ["ии", "нейросети", "ml"],
  },
  {
    title: "Машинное обучение",
    content:
      "Машинное обучение (ML) — подраздел ИИ, focused на алгоритмах, которые улучшаются через опыт. Включает обучение с учителем, без учителя, с подкреплением, а также ансамблевые методы.",
    tags: ["ии", "ml", "обучение"],
  },
  {
    title: "Глубокое обучение",
    content:
      "Глубокое обучение использует многослойные нейронные сети для изучения представлений данных. Ключевые архитектуры: CNN для изображений, RNN для последовательностей, Трансформеры для текста.",
    tags: ["ии", "глубокое-обучение", "neural-networks"],
  },
  {
    title: "Обработка естественного языка",
    content:
      "NLP — взаимодействие компьютеров и человеческого языка. Задачи: анализ текста, машинный перевод, сентимент-анализ, извлечение сущностей, суммаризация и генерация текста.",
    tags: ["ии", "nlp", "текст"],
  },
  {
    title: "Компьютерное зрение",
    content:
      "Компьютерное зрение позволяет машинам «видеть» и интерпретировать визуальную информацию. Применяется в автономных транспортных средствах, медицине, системах безопасности.",
    tags: ["ии", "cv", "компьютерное-зрение"],
  },
  {
    title: "Большие языковые модели",
    content:
      "LLM обучаются на массивных текстовых корпусах и способны генерировать человекоподобный текст. Примеры: GPT, Claude, Llama. Архитектура: Трансформеры с механизмом внимания.",
    tags: ["ии", "llm", "генерация"],
  },
  {
    title: "Рекомендательные системы",
    content:
      "Рекомендательные системы предсказывают предпочтения пользователей. Используют коллаборативную фильтрацию, контентную фильтрацию и гибридные подходы. Применяются в streaming-сервисах и e-commerce.",
    tags: ["ии", "рекомендации", "data"],
  },
  {
    title: "Робототехника",
    content:
      "Робототехника объединяет ИИ с инженерией для создания умных роботов. Включает планирование траекторий, компьютерное зрение, управление и обучение с подкреплением.",
    tags: ["ии", "робототехника", "hardware"],
  },
  {
    title: "Этика ИИ",
    content:
      "Этика ИИ изучает моральные implications разработки ИИ систем. Ключевые вопросы: предвзятость алгоритмов, прозрачность решений, приватность данных, безопасность AGI.",
    tags: ["ии", "этика", "безопасность"],
  },
];

function runTests(): void {
  console.log("=".repeat(60));
  console.log("Zettelkasten MCP Server - Integration Tests");
  console.log("=".repeat(60));

  const server = spawn("node", ["dist/index.js"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "inherit"],
  }) as ChildProcess & { stdin: { write: (data: string) => void } };

  let buffer = "";
  let ready = false;
  const responses: McpResponse[] = [];

  server.stdout.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: McpResponse = JSON.parse(line);
          responses.push(response);

          if (response.result?.content) {
            const text = response.result.content[0]?.text;
            if (text) {
              const firstLine = text.split("\n")[0];
              if (!text.includes("Note created")) {
                console.log(`  ✓ ${firstLine}`);
              }
            }
          }

          if (!ready && response.result?.serverInfo) {
            ready = true;
            executeTests(server);
          }
        } catch {
          // Skip non-JSON output
        }
      }
    }
  });

  server.on("close", () => {
    console.log("\n" + "=".repeat(60));
    console.log(`Tests completed. ${responses.length} responses received.`);
    console.log("=".repeat(60));
    process.exit(0);
  });

  setTimeout(() => {
    sendRequest(server, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });
  }, 500);

  setTimeout(() => {
    server.kill();
  }, 30000);

  function executeTests(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("\n[Test 1/12] Creating test notes...");

    for (let i = 0; i < testNotes.length; i++) {
      const note = testNotes[i]!;
      const request = createNote(note.title, note.content, "permanent", note.tags);
      setTimeout(() => sendRequest(server, request), i * 300);
    }

    setTimeout(() => runSearchTests(server), 4000);
  }

  function runSearchTests(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 2/12] Testing search by query...");

    sendRequest(server, {
      jsonrpc: "2.0",
      id: nextId(),
      method: "tools/call",
      params: {
        name: "zk_search_notes",
        arguments: { query: "нейросети", limit: 5 },
      },
    });

    setTimeout(() => runTagTests(server), 800);
  }

  function runTagTests(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 3/12] Testing search by tags...");

    sendRequest(server, {
      jsonrpc: "2.0",
      id: nextId(),
      method: "tools/call",
      params: {
        name: "zk_search_notes",
        arguments: { tags: "ии,llm", limit: 10 },
      },
    });

    setTimeout(() => runGetAllTags(server), 800);
  }

  function runGetAllTags(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 4/12] Testing get all tags...");

    sendRequest(server, {
      jsonrpc: "2.0",
      id: nextId(),
      method: "tools/call",
      params: {
        name: "zk_get_all_tags",
        arguments: {},
      },
    });

    setTimeout(() => runGetNote(server), 800);
  }

  function runGetNote(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 5/12] Testing get note by ID...");

    const createNoteResponse = responses.find((r) =>
      r.result?.content?.[0]?.text?.includes("Note created"),
    );
    if (createNoteResponse) {
      const match = createNoteResponse.result.content[0].text.match(/ID: ([^\s]+)/);
      if (match) {
        const noteId = match[1];

        sendRequest(server, {
          jsonrpc: "2.0",
          id: nextId(),
          method: "tools/call",
          params: {
            name: "zk_get_note",
            arguments: { identifier: noteId },
          },
        });
      }
    }

    setTimeout(() => runUpdateNote(server), 1500);
  }

  function runUpdateNote(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 6/12] Testing update note...");

    const createNoteResponse = responses.find((r) =>
      r.result?.content?.[0]?.text?.includes("Note created"),
    );
    if (createNoteResponse) {
      const match = createNoteResponse.result.content[0].text.match(/ID: ([^\s]+)/);
      if (match) {
        const noteId = match[1];

        sendRequest(server, {
          jsonrpc: "2.0",
          id: nextId(),
          method: "tools/call",
          params: {
            name: "zk_update_note",
            arguments: {
              note_id: noteId,
              tags: "ии,тест-обновление",
            },
          },
        });
      }
    }

    setTimeout(() => runCreateLinks(server), 1500);
  }

  function runCreateLinks(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 7/12] Testing create links...");

    const createResponses = responses.filter((r) =>
      r.result?.content?.[0]?.text?.includes("Note created"),
    );

    if (createResponses.length >= 2) {
      const noteIds: string[] = [];
      for (const resp of createResponses) {
        const match = resp.result!.content![0]!.text!.match(/ID: ([^\s]+)/);
        if (match) {
          noteIds.push(match[1]);
        }
      }

      console.log(`  Creating ${noteIds.length} links between all notes...`);

      // Create links between consecutive notes (forming a chain)
      for (let i = 0; i < noteIds.length - 1; i++) {
        const sourceId = noteIds[i]!;
        const targetId = noteIds[i + 1]!;
        const sourceTitle = testNotes[i]!.title;
        const targetTitle = testNotes[i + 1]!.title;

        setTimeout(() => {
          const request = createLink(
            sourceId,
            targetId,
            "related",
            `${sourceTitle} → ${targetTitle}`,
            true,
          );
          sendRequest(server, request);
        }, i * 300);
      }

      setTimeout(() => {
        // Link first to last
        sendRequest(
          server,
          createLink(
            noteIds[0]!,
            noteIds[noteIds.length - 1]!,
            "supports",
            "Обзор → Фундамент",
            true,
          ),
        );

        // Link ML-related notes
        setTimeout(() => {
          sendRequest(
            server,
            createLink(
              noteIds[3]!,
              noteIds[1]!,
              "extends",
              "Глубокое обучение extends ML",
              true,
            ),
          );
        }, 300);

        setTimeout(() => {
          sendRequest(
            server,
            createLink(
              noteIds[4]!,
              noteIds[3]!,
              "refines",
              "NLP refinements Глубокое обучение",
              true,
            ),
          );
        }, 600);

        setTimeout(() => {
          sendRequest(
            server,
            createLink(
              noteIds[6]!,
              noteIds[4]!,
              "uses",
              "LLM использует NLP",
              true,
            ),
          );
        }, 900);

        setTimeout(() => runGetLinkedNotes(server), 1000);
      }, noteIds.length * 300 + 500);
    } else {
      setTimeout(() => runGetLinkedNotes(server), 1000);
    }
  }

  function runGetLinkedNotes(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 8/12] Testing get linked notes...");

    const createResponses = responses.filter((r) =>
      r.result?.content?.[0]?.text?.includes("Note created"),
    );
    if (createResponses.length > 0) {
      const match = createResponses[0]!.result!.content![0]!.text!.match(
        /ID: ([^\s]+)/,
      );
      if (match) {
        const noteId = match[1];
        sendRequest(server, {
          jsonrpc: "2.0",
          id: nextId(),
          method: "tools/call",
          params: {
            name: "zk_get_linked_notes",
            arguments: {
              note_id: noteId,
              direction: "both",
            },
          },
        });
      }
    }

    setTimeout(() => runFindSimilarNotes(server), 1000);
  }

  function runFindSimilarNotes(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 9/12] Testing find similar notes...");

    const createResponses = responses.filter((r) =>
      r.result?.content?.[0]?.text?.includes("Note created"),
    );
    if (createResponses.length > 0) {
      const match = createResponses[0]!.result!.content![0]!.text!.match(
        /ID: ([^\s]+)/,
      );
      if (match) {
        const noteId = match[1];
        sendRequest(server, {
          jsonrpc: "2.0",
          id: nextId(),
          method: "tools/call",
          params: {
            name: "zk_find_similar_notes",
            arguments: {
              note_id: noteId,
              threshold: 0.1,
              limit: 3,
            },
          },
        });
      }
    }

    setTimeout(() => runFindCentralNotes(server), 1000);
  }

  function runFindCentralNotes(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 10/12] Testing find central notes...");

    sendRequest(server, {
      jsonrpc: "2.0",
      id: nextId(),
      method: "tools/call",
      params: {
        name: "zk_find_central_notes",
        arguments: { limit: 5 },
      },
    });

    setTimeout(() => runFindOrphanedNotes(server), 800);
  }

  function runFindOrphanedNotes(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 11/12] Testing find orphaned notes...");

    sendRequest(server, {
      jsonrpc: "2.0",
      id: nextId(),
      method: "tools/call",
      params: {
        name: "zk_find_orphaned_notes",
        arguments: {},
      },
    });

    setTimeout(() => runListNotesByDate(server), 800);
  }

  function runListNotesByDate(
    server: ChildProcess & { stdin: { write: (data: string) => void } },
  ): void {
    console.log("[Test 12/12] Testing list notes by date...");

    sendRequest(server, {
      jsonrpc: "2.0",
      id: nextId(),
      method: "tools/call",
      params: {
        name: "zk_list_notes_by_date",
        arguments: { limit: 10 },
      },
    });

    setTimeout(() => server.kill(), 2000);
  }
}

void runTests();
