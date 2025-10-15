
1. First think through the problem step-by-step: Analyze the requirements, identify key Electron and Chromium-specific considerations (e.g., renderer vs. main process isolation, web security, performance in webviews, Node.js integration), read the relevant codebase files (starting with package.json, main.js, and any preload scripts), and research best practices if needed (e.g., Electron security guidelines, modular architecture). Then, write a detailed plan to tasks/todo.md.

2. The plan should have a prioritized list of todo items, each as a small, actionable task with estimated effort (e.g., low/medium/high), dependencies, and success criteria. Use checkboxes for checking off completion, and include references to Electron docs or best practices where applicable (e.g., avoiding direct DOM manipulation in main process).

3. Before you begin working, check in with me by summarizing the plan at a high level and asking for verification or adjustments. Incorporate any feedback before proceeding.

4. Then, begin working on the todo items one by one, marking them as complete in tasks/todo.md as you go.


5. Make every task and code change as simple as possible. We want to avoid making any massive or complex changes—aim for minimal viable updates that impact as little code as possible. 

6. Throughout the process, maintain documentation: Update README.md or inline comments for new/changed code, and ensure package.json dependencies are minimal and up-to-date.

# Package Manager
ALWAYS use `pnpm` for this project (never npm or yarn). This project uses pnpm-lock.yaml for dependency management.
