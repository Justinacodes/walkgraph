# Project Requirements Document

## Project Overview

**Name:** WalkGraph
**Mission:** Help organizations create, publish, and navigate indoor walking maps with graph-based routing and QR checkpoints.
**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, NextAuth, Prisma, PostgreSQL/Supabase, pnpm

## Functional Requirements

| FR ID | Description | User Story | Status |
| :--- | :--- | :--- | :--- |
| FR-001 | User authentication and sessions | As an admin user, I want to register and sign in securely, so that I can manage protected map data. | MUS |
| FR-002 | Organization and building management | As an organization owner, I want to create organizations and buildings, so that maps are grouped by real-world ownership and location. | MUS |
| FR-003 | Floor, node, and edge graph editor | As a mapper, I want to create floors, place nodes, and connect edges, so that each building has a routable indoor graph. | MUS |
| FR-004 | Shortest-path route testing and public navigation | As a visitor, I want to search destinations and receive walking directions, so that I can navigate a published building. | MUS |
| FR-005 | QR checkpoint generation | As a mapper, I want QR codes for nodes, so that visitors can start navigation from a scanned checkpoint. | MUS |
| FR-006 | Building publication and discovery | As an organization owner, I want to publish buildings to a public explore area, so that visitors can find available maps. | MUS |
| FR-007 | Offline map export | As a visitor or operator, I want downloadable map packages, so that navigation data can be used with limited connectivity. | Future |
| FR-008 | Accessibility-aware routing preferences | As a visitor with accessibility needs, I want routes that avoid stairs or restricted paths, so that directions match my mobility requirements. | Future |
