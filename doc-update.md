# Document Update: Sketch Cybersecurity Adaptation

This document summarizes the modifications and discussions undertaken to adapt the Sketch framework for cybersecurity and penetration testing purposes.

## 1. Core Adaptation Strategy

The primary goal is to transform Sketch from a software engineering assistant into a penetration testing assistant. This involves leveraging its modular architecture by replacing existing tools with cybersecurity-focused ones and configuring it to run within a Kali Linux environment.

## 2. Dockerfile Modifications for Kali Linux Environment

*   **Base Image Change:** The base Docker image was switched from `ubuntu:24.04` to `kalilinux/kali-rolling` to provide a comprehensive suite of pre-installed penetration testing tools.
*   **Root Access:** Lines related to creating and switching to a non-root user were removed to ensure the agent runs with `root` privileges inside the container, which is necessary for many pentesting tools and `pty` operations.
*   **Package Installation:** The `apt-get install` commands were updated to include common penetration testing tools such as `nmap`, `metasploit-framework`, `john`, `hydra`, `sqlmap`, and `aircrack-ng`.
*   **Dependency Fix:** Corrected a build error by changing `docker-compose-v2` to `docker-compose` in the package installation list, as the former was not available in Kali repositories.

## 3. LLM Configuration for Custom Models (Azure OpenAI)

Instructions were provided on how to configure Sketch to use custom OpenAI-compatible models, such as those hosted on Azure:

*   Set the `OPENAI_API_KEY` environment variable to the Azure API key.
*   Set the `OPENAI_API_HOST` environment variable to the Azure endpoint URL.
*   Use the `-model` flag to specify the Azure deployment name when running Sketch.

## 4. Container Permissions for Networking Tools

To address "operation not permitted" errors encountered when running networking tools like `nmap`:

*   It was clarified that Docker capabilities must be granted at runtime, not within the `Dockerfile`.
*   The default value for the `-docker-args` flag in `cmd/sketch/main.go` was modified to include `--cap-add=NET_ADMIN --cap-add=NET_RAW`. This ensures that the necessary network capabilities are automatically granted to the container when Sketch is launched.

## 5. Docker Network Configuration (Bridge Mode)

Discussions revolved around working with the default Docker bridge network:

*   **Port Mapping:** For accessing services inside the container from the host or other LAN machines, explicit port mapping (e.g., `-p 8080:80`) is required.
*   **Container IP:** The container operates with its own IP address within the Docker bridge network (e.g., `172.17.0.2`), discoverable via `docker inspect`.
*   **LAN Access:** The container can access LAN resources directly by their IP address, with Docker handling the routing, and traffic appearing to originate from the host machine's LAN IP.
*   **Reversion of Host Networking:** Previous changes to enable `--network=host` by default were reverted to maintain the Docker bridge network setup.

## 6. Agent System Prompt Modifications

*   **`loop/agent_system_prompt.txt`:** This core system prompt was significantly modified to change the agent's persona from a software engineer to a "skilled and ethical penetration tester and cybersecurity analyst." The workflow section was updated to reflect a standard penetration testing methodology: Reconnaissance, Scanning, Exploitation, and Reporting.
*   **`claudetool/keyword_system_prompt.txt`:** This prompt, being specific to code search relevance, was deemed not to require any modifications for the cybersecurity adaptation.

## 7. Roadmap for Future Pentesting Tasks

A roadmap was outlined for future development, including:

*   Implementing a robust pseudo-terminal (`pty`) for interactive shell tools.
*   Developing specialized wrapper tools for parsing structured output from pentesting utilities.
*   Rewriting `analyze.go` for autonomous network reconnaissance.
*   Integrating common vulnerability scanners and exploitation frameworks.
*   Automating reporting and documentation.
*   Establishing ethical hacking guidelines and secure credential management.
*   Exploring proxy integration and dynamic tool creation.
