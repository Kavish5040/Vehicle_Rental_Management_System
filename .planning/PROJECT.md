# Vehicle Rental Graph Intelligence System (DBMS DA3)

## Project Overview
A production-grade, Neo4j-first Vehicle Rental Graph Intelligence System built for DBMS Digital Assignment 3 (DA3).
The application showcases why graph databases and Cypher graph pattern traversals excel at modeled interconnected domains (like vehicle rental networks, bookings, fleet availability, branches, maintenance, and analytics).

## Source of Truth
The existing Neo4j AuraDB Free instance holds live data for 10 core entity labels:
- `Customer`
- `VehicleType`
- `Branch`
- `Vehicle`
- `Booking`
- `Rental`
- `Payment`
- `Employee`
- `Maintenance`
- `Review`

**Rules:**
- Do NOT wipe, reset, alter schema destructively, or reseed the database.
- Read live data directly from Neo4j.
- No fabricated or hardcoded metrics.
- Keep credentials strictly isolated in backend `.env`.

## Architecture & Technology Stack
- **Backend:** Node.js, Express, TypeScript, `neo4j-driver`, dotenv, cors
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide icons
- **Security:** Backend-only database queries, parameterized Cypher statements, credential isolation
