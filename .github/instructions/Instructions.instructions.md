---
applyTo: '**'
---
# AI Coding Instructions for React + Firebase Project

## Project Context
- Tech stack: React (frontend), Firebase (auth, Firestore, storage, hosting), optional Node.js for server functions
- Goal: Scalable, secure, maintainable web app with clean UI and efficient Firebase integration
- Audience: End-users expecting responsive, reliable, and secure interactions
- Constraints: Respect Firebase quotas, React best practices, avoid exposing secrets

## Coding Guidelines

### Code Quality & Structure
- Use functional components with React Hooks (no class components)
- Apply modular architecture: components, hooks, services
- Naming conventions: camelCase for variables/functions, PascalCase for components
- Prefer TypeScript types/interfaces if project uses TS

### Firebase Integration
- Use Firebase SDK v9+ modular imports
- Never hardcode API keys or secrets; use environment variables
- Handle async calls with async/await and try/catch
- Validate Firestore queries and enforce Firebase Security Rules

### Security & Best Practices
- Sanitize user input before storing or displaying
- Use Firebase Authentication for secure login flows
- Enforce role-based access control in Firestore rules
- Avoid exposing sensitive data in client-side code

### Performance & UX
- Implement lazy loading and code splitting for large components
- Cache Firebase queries where possible (React Query or local state)
- Optimize re-renders with React.memo and useMemo
- Provide clear loading and error states for async operations

### Testing & Review
- Write unit tests for utilities and integration tests for Firebase calls
- Include comments explaining intent in AI-generated code
- Review changes for readability, maintainability, security, performance, and style consistency

### Documentation & Communication
- AI answers must include contextual explanation, not just raw code
- Provide step-by-step instructions when suggesting fixes or features
- Use Markdown formatting for clarity in documentation
- Highlight strengths and risks when reviewing code
