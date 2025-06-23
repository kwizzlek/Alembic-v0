
# AI Agent Implementation Principles for Medical Device Marketing Platform

## Table of Contents
- [Technology Stack Adherence](#technology-stack-adherence)
- [Multi-Tenant Architecture Requirements](#multi-tenant-architecture-requirements)
- [Code Quality and Documentation Standards](#code-quality-and-documentation-standards)
- [Error Handling and User Experience](#error-handling-and-user-experience)
- [Medical Device Compliance Considerations](#medical-device-compliance-considerations)
- [Performance and Scalability](#performance-and-scalability)
- [Deployment and DevOps](#deployment-and-devops)
- [AI Integration Best Practices](#ai-integration-best-practices)
- [Environment Variables](#environment-variables)
- [Testing Strategy](#testing-strategy)
- [API Versioning](#api-versioning)
- [Netlify Deployment Guidelines](#netlify-deployment-guidelines)
- [Supabase Configuration](#supabase-configuration)
- [OpenAI Integration](#openai-integration)

## Style
- use shadcn/ui components where possible with theme Teal throughout

## Technology Stack Adherence

**Frontend Technology Stack**

- Always use Next.js with TypeScript for all frontend development
- Implement responsive design using Tailwind CSS exclusively
- Deploy frontend applications exclusively on Netlify
- Use React components with proper TypeScript interfaces

**Backend Technology Stack**

- Implement all backend logic using Netlify Functions (serverless)
- Use Supabase as the primary database, authentication, and storage provider
- Integrate OpenAI API for all AI-powered content generation
- Maintain serverless architecture principles throughout


## Environment Variables

- Store all environment variables in `.env` files (never commit `.env` to version control)
- Use `NEXT_PUBLIC_` prefix for client-side accessible variables
- Document all required environment variables in `.env.example`
- Use TypeScript types for environment variables with `@/types/env.d.ts`
- Never commit sensitive information in environment files

## Testing Strategy

### Unit Testing
- Write unit tests for all utility functions and hooks
- Use Jest and React Testing Library for component testing
- Aim for at least 80% code coverage
- Test all business logic and edge cases

### Integration Testing
- Test component interactions
- Verify API integrations with mocked responses
- Test authentication and authorization flows
- Validate form submissions and data flow

### E2E Testing
- Use Cypress for end-to-end testing
- Test critical user journeys
- Include visual regression testing
- Test across different viewport sizes

## API Versioning

- Use URL versioning (e.g., `/api/v1/endpoint`)
- Maintain backward compatibility for at least one previous version
- Document all API changes in `CHANGELOG.md`
- Include version in response headers
- Deprecate old versions with clear sunset policies

## Multi-Tenant Architecture Requirements

**Tenant Isolation**

- Always implement tenant-specific data isolation in all database operations[^1][^2]
- Use tenant-aware middleware for all API routes and functions[^1][^2]
- Organize file storage with tenant-specific prefixes in Supabase Storage[^1]
- Ensure all workflows and content are tenant-scoped[^1][^2]

**Security and Access Control**

- Implement Row Level Security (RLS) policies for all Supabase tables[^1]
- Use role-based access control (admin, user, approver) throughout the platform[^1][^2]
- Always validate tenant context in API endpoints[^1][^2]
- Implement proper authentication checks on all protected routes[^1]


## Code Quality and Documentation Standards

**TypeScript Implementation**

- Always use TypeScript with strict type checking enabled[^1][^2]
- Define interfaces for all data structures, API responses, and component props[^1]
- Create type definitions for tenant, user, workflow, and document entities[^1]
- Use proper error typing and handling throughout[^1]

**Code Documentation**

- Document all functions with JSDoc comments explaining purpose, parameters, and return values[^1]
- Add inline comments for complex business logic, especially regulatory compliance features[^2][^3]
- Maintain clear README files for each major component or service[^1]
- Document all environment variables and their purposes[^1]

**Component Organization**

- Follow the established project structure: `/pages`, `/components`, `/lib`, `/utils`[^1]
- Separate UI components from business logic components[^1]
- Create reusable components for common UI elements (buttons, inputs, modals)[^1]
- Organize components by feature domain (auth, documents, workflows, AI)[^1]


## Error Handling and User Experience

**Comprehensive Error Handling**

- Implement try-catch blocks for all async operations[^1]
- Provide user-friendly error messages for all failure scenarios[^1]
- Add retry logic for external API calls (OpenAI, Supabase)[^1]
- Log errors appropriately for debugging while maintaining user privacy[^1]

**Loading States and Feedback**

- Always implement loading states for async operations[^1]
- Show progress indicators for file uploads and AI content generation[^1]
- Provide immediate feedback for user actions[^1]
- Handle offline scenarios gracefully where applicable[^1]


## Medical Device Compliance Considerations

**Regulatory Awareness**

- Always consider regulatory compliance when implementing content generation features[^2][^3]
- Implement audit trails for all content creation and approval workflows[^2][^3]
- Ensure data handling meets medical device industry standards[^3]
- Validate marketing claims against regulatory requirements where possible[^2][^3]

**Content Management**

- Version all generated content and maintain revision history[^2]
- Implement approval workflow states (draft, pending, approved, rejected)[^1][^2]
- Store metadata for all documents including compliance-related information[^1][^2]
- Enable content rollback capabilities for compliance needs[^2]


## Performance and Scalability

**Database Optimization**

- Use proper indexing for tenant-aware queries[^1]
- Implement pagination for large data sets[^1]
- Cache frequently accessed data using appropriate strategies[^2]
- Optimize queries to prevent N+1 problems[^1]

**API Design**

- Design all APIs with RESTful principles[^1][^2]
- Implement proper HTTP status codes and response formats[^1]
- Add rate limiting for AI service endpoints[^2]
- Use connection pooling for database operations[^1]


## Environment and Configuration Management

**Environment Variables**

- Store all sensitive configuration in environment variables[^1]
- Use the established naming convention (NEXT_PUBLIC_ for client-side)[^1]
- Never commit API keys or secrets to version control[^1]
- Maintain separate environment configurations for development, staging, and production[^1]

**Deployment Configuration**

- Always use the established `netlify.toml` configuration format[^1]
- Configure proper redirects for API routes and SPA routing[^1]
- Set up appropriate build commands and environment variables in Netlify[^1]
- Test deployment configuration in staging before production[^1]


## AI Integration Best Practices

**Perplexity Integration**
- Where possible, consider a framework where in future AI service providers can be easily swapped out[^1]
- Use structured prompts with medical device marketing context[^1][^2]
- Implement proper error handling for AI service failures[^1]
- Add usage tracking per tenant for billing and monitoring[^1]
- Cache AI responses where appropriate to reduce costs[^2]

**Content Generation**

- Always validate AI-generated content before presenting to users[^2][^3]
- Provide editing capabilities for all generated content[^1]
- Store prompt templates for consistency and reusability[^1][^2]
- Implement content moderation for regulatory compliance[^2][^3]


## Testing and Quality Assurance

**Testing Requirements**

- Test all functionality with multiple tenant contexts[^1][^2]
- Verify tenant data isolation in all scenarios[^1][^2]
- Test authentication and authorization thoroughly[^1]
- Validate file upload and storage functionality across different file types[^1]

T
