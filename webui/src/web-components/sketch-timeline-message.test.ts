import { test, expect } from "@sand4rt/experimental-ct-web";
import { SketchTimelineMessage } from "./sketch-timeline-message";
import {
  AgentMessage,
  CodingAgentMessageType,
  GitCommit,
  Usage,
} from "../types";

// Helper function to create mock timeline messages
function createMockMessage(props: Partial<AgentMessage> = {}): AgentMessage {
  return {
    idx: props.idx || 0,
    type: props.type || "agent",
    content: props.content || "Hello world",
    timestamp: props.timestamp || "2023-05-15T12:00:00Z",
    elapsed: props.elapsed || 1500000000, // 1.5 seconds in nanoseconds
    end_of_turn: props.end_of_turn || false,
    conversation_id: props.conversation_id || "conv123",
    tool_calls: props.tool_calls || [],
    commits: props.commits || [],
    usage: props.usage,
    ...props,
  };
}

test("renders with basic message content", async ({ mount }) => {
  const message = createMockMessage({
    type: "agent",
    content: "This is a test message",
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".message-text")).toBeVisible();
  await expect(component.locator(".message-text")).toContainText(
    "This is a test message",
  );
});

test.skip("renders with correct message type classes", async ({ mount }) => {
  const messageTypes: CodingAgentMessageType[] = [
    "user",
    "agent",
    "error",
    "budget",
    "tool",
    "commit",
    "auto",
  ];

  for (const type of messageTypes) {
    const message = createMockMessage({ type });

    const component = await mount(SketchTimelineMessage, {
      props: {
        message: message,
      },
    });

    await expect(component.locator(".message")).toBeVisible();
    await expect(component.locator(`.message.${type}`)).toBeVisible();
  }
});

test("renders end-of-turn marker correctly", async ({ mount }) => {
  const message = createMockMessage({
    end_of_turn: true,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".message")).toBeVisible();
  await expect(component.locator(".message.end-of-turn")).toBeVisible();
});

test("formats timestamps correctly", async ({ mount }) => {
  const message = createMockMessage({
    timestamp: "2023-05-15T12:00:00Z",
    type: "agent",
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  // Toggle the info panel to view timestamps
  await component.locator(".info-icon").click();
  await expect(component.locator(".message-info-panel")).toBeVisible();

  // Find the timestamp in the info panel
  const timeInfoRow = component.locator(".info-row", { hasText: "Time:" });
  await expect(timeInfoRow).toBeVisible();
  await expect(timeInfoRow.locator(".info-value")).toContainText(
    "May 15, 2023",
  );
  // For end-of-turn messages, duration is shown separately
  const endOfTurnMessage = createMockMessage({
    timestamp: "2023-05-15T12:00:00Z",
    type: "agent",
    end_of_turn: true,
  });

  const endOfTurnComponent = await mount(SketchTimelineMessage, {
    props: {
      message: endOfTurnMessage,
    },
  });

  // For end-of-turn messages, duration is shown in the end-of-turn indicator
  await expect(
    endOfTurnComponent.locator(".end-of-turn-indicator"),
  ).toBeVisible();
  await expect(
    endOfTurnComponent.locator(".end-of-turn-indicator"),
  ).toContainText("1.5s");
});

test("renders markdown content correctly", async ({ mount }) => {
  const markdownContent =
    "# Heading\n\n- List item 1\n- List item 2\n\n`code block`";
  const message = createMockMessage({
    content: markdownContent,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".markdown-content")).toBeVisible();

  // Check HTML content
  const html = await component
    .locator(".markdown-content")
    .evaluate((element) => element.innerHTML);
  expect(html).toContain("<h1>Heading</h1>");
  expect(html).toContain("<ul>");
  expect(html).toContain("<li>List item 1</li>");
  expect(html).toContain("<code>code block</code>");
});

test("displays usage information when available", async ({ mount }) => {
  const usage: Usage = {
    input_tokens: 150,
    output_tokens: 300,
    cost_usd: 0.025,
    cache_read_input_tokens: 50,
    cache_creation_input_tokens: 0,
  };

  const message = createMockMessage({
    usage,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  // Toggle the info panel to view usage information
  await component.locator(".info-icon").click();
  await expect(component.locator(".message-info-panel")).toBeVisible();

  // Find the tokens info in the info panel
  const tokensInfoRow = component.locator(".info-row", { hasText: "Tokens:" });
  await expect(tokensInfoRow).toBeVisible();
  await expect(tokensInfoRow).toContainText("Input: " + "150".toLocaleString());
  await expect(tokensInfoRow).toContainText(
    "Cache read: " + "50".toLocaleString(),
  );
  // Check for output tokens
  await expect(tokensInfoRow).toContainText(
    "Output: " + "300".toLocaleString(),
  );

  // Check for cost
  await expect(tokensInfoRow).toContainText("Cost: $0.03");
});

test("renders commit information correctly", async ({ mount }) => {
  const commits: GitCommit[] = [
    {
      hash: "1234567890abcdef",
      subject: "Fix bug in application",
      body: "This fixes a major bug in the application\n\nSigned-off-by: Developer",
      pushed_branch: "main",
    },
  ];

  const message = createMockMessage({
    commits,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".commits-container")).toBeVisible();
  await expect(component.locator(".commit-notification")).toBeVisible();
  await expect(component.locator(".commit-notification")).toContainText(
    "1 new",
  );

  await expect(component.locator(".commit-hash")).toBeVisible();
  await expect(component.locator(".commit-hash")).toHaveText("12345678"); // First 8 chars

  await expect(component.locator(".pushed-branch")).toBeVisible();
  await expect(component.locator(".pushed-branch")).toContainText("main");
});

test("dispatches show-commit-diff event when commit diff button is clicked", async ({
  mount,
}) => {
  const commits: GitCommit[] = [
    {
      hash: "1234567890abcdef",
      subject: "Fix bug in application",
      body: "This fixes a major bug in the application",
      pushed_branch: "main",
    },
  ];

  const message = createMockMessage({
    commits,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".commit-diff-button")).toBeVisible();

  // Set up promise to wait for the event
  const eventPromise = component.evaluate((el) => {
    return new Promise((resolve) => {
      el.addEventListener(
        "show-commit-diff",
        (event) => {
          resolve((event as CustomEvent).detail);
        },
        { once: true },
      );
    });
  });

  // Click the diff button
  await component.locator(".commit-diff-button").click();

  // Wait for the event and check its details
  const detail = await eventPromise;
  expect(detail["commitHash"]).toBe("1234567890abcdef");
});

test.skip("handles message type icon display correctly", async ({ mount }) => {
  // First message of a type should show icon
  const firstMessage = createMockMessage({
    type: "user",
    idx: 0,
  });

  // Second message of same type should not show icon
  const secondMessage = createMockMessage({
    type: "user",
    idx: 1,
  });

  // Test first message (should show icon)
  const firstComponent = await mount(SketchTimelineMessage, {
    props: {
      message: firstMessage,
    },
  });

  await expect(firstComponent.locator(".message-icon")).toBeVisible();
  await expect(firstComponent.locator(".message-icon")).toHaveText("U");

  // Test second message with previous message of same type
  const secondComponent = await mount(SketchTimelineMessage, {
    props: {
      message: secondMessage,
      previousMessage: firstMessage,
    },
  });

  await expect(secondComponent.locator(".message-icon")).not.toBeVisible();
});

test("formats numbers correctly", async ({ mount }) => {
  const component = await mount(SketchTimelineMessage, {});

  // Test accessing public method via evaluate
  const result1 = await component.evaluate((el: SketchTimelineMessage) =>
    el.formatNumber(1000),
  );
  expect(result1).toBe("1,000");

  const result2 = await component.evaluate((el: SketchTimelineMessage) =>
    el.formatNumber(null, "N/A"),
  );
  expect(result2).toBe("N/A");

  const result3 = await component.evaluate((el: SketchTimelineMessage) =>
    el.formatNumber(undefined, "--"),
  );
  expect(result3).toBe("--");
});

test("formats currency values correctly", async ({ mount }) => {
  const component = await mount(SketchTimelineMessage, {});

  // Test with different precisions
  const result1 = await component.evaluate((el: SketchTimelineMessage) =>
    el.formatCurrency(10.12345, "$0.00", true),
  );
  expect(result1).toBe("$10.1235"); // message level (4 decimals)

  const result2 = await component.evaluate((el: SketchTimelineMessage) =>
    el.formatCurrency(10.12345, "$0.00", false),
  );
  expect(result2).toBe("$10.12"); // total level (2 decimals)

  const result3 = await component.evaluate((el: SketchTimelineMessage) =>
    el.formatCurrency(null, "N/A"),
  );
  expect(result3).toBe("N/A");

  const result4 = await component.evaluate((el: SketchTimelineMessage) =>
    el.formatCurrency(undefined, "--"),
  );
  expect(result4).toBe("--");
});

test("properly escapes HTML in code blocks", async ({ mount }) => {
  const maliciousContent = `Here's some HTML that should be escaped:

\`\`\`html
<script>alert('XSS!');</script>
<div onclick="alert('Click attack')">Click me</div>
<img src="x" onerror="alert('Image attack')">
\`\`\`

The HTML above should be escaped and not executable.`;

  const message = createMockMessage({
    content: maliciousContent,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".markdown-content")).toBeVisible();

  // Check that the code block is rendered with proper HTML escaping
  const codeElement = component.locator(".code-block-container code");
  await expect(codeElement).toBeVisible();

  // Get the text content (not innerHTML) to verify escaping
  const codeText = await codeElement.textContent();
  expect(codeText).toContain("<script>alert('XSS!');</script>");
  expect(codeText).toContain("<div onclick=\"alert('Click attack')\">");
  expect(codeText).toContain('<img src="x" onerror="alert(\'Image attack\')">');

  // Verify that the HTML is actually escaped in the DOM
  const codeHtml = await codeElement.innerHTML();
  expect(codeHtml).toContain("&lt;script&gt;"); // < should be escaped
  expect(codeHtml).toContain("&lt;div"); // < should be escaped
  expect(codeHtml).toContain("&lt;img"); // < should be escaped
  expect(codeHtml).not.toContain("<script>"); // Actual script tags should not exist
  expect(codeHtml).not.toContain("<div onclick"); // Actual event handlers should not exist
});

test("properly escapes JavaScript in code blocks", async ({ mount }) => {
  const maliciousContent = `Here's some JavaScript that should be escaped:

\`\`\`javascript
function malicious() {
    document.body.innerHTML = '<h1>Hacked!</h1>';
    window.location = 'http://evil.com';
}
malicious();
\`\`\`

The JavaScript above should be escaped and not executed.`;

  const message = createMockMessage({
    content: maliciousContent,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".markdown-content")).toBeVisible();

  // Check that the code block is rendered with proper HTML escaping
  const codeElement = component.locator(".code-block-container code");
  await expect(codeElement).toBeVisible();

  // Get the text content to verify the JavaScript is preserved as text
  const codeText = await codeElement.textContent();
  expect(codeText).toContain("function malicious()");
  expect(codeText).toContain("document.body.innerHTML");
  expect(codeText).toContain("window.location");

  // Verify that any HTML-like content is escaped
  const codeHtml = await codeElement.innerHTML();
  expect(codeHtml).toContain("&lt;h1&gt;Hacked!&lt;/h1&gt;"); // HTML should be escaped
});

test("mermaid diagrams still render correctly", async ({ mount }) => {
  const diagramContent = `Here's a mermaid diagram:

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do Something]
    B -->|No| D[Do Something Else]
    C --> E[End]
    D --> E
\`\`\`

The diagram above should render as a visual chart.`;

  const message = createMockMessage({
    content: diagramContent,
  });

  const component = await mount(SketchTimelineMessage, {
    props: {
      message: message,
    },
  });

  await expect(component.locator(".markdown-content")).toBeVisible();

  // Check that the mermaid container is present
  const mermaidContainer = component.locator(".mermaid-container");
  await expect(mermaidContainer).toBeVisible();

  // Check that the mermaid div exists with the right content
  const mermaidDiv = component.locator(".mermaid");
  await expect(mermaidDiv).toBeVisible();

  // Wait a bit for mermaid to potentially render
  await new Promise((resolve) => setTimeout(resolve, 500));

  // The mermaid content should either be the original code or rendered SVG
  const renderedContent = await mermaidDiv.innerHTML();
  // It should contain either the graph definition or SVG
  const hasMermaidCode = renderedContent.includes("graph TD");
  const hasSvg = renderedContent.includes("<svg");
  expect(hasMermaidCode || hasSvg).toBe(true);
});
