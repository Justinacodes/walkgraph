# WalkGraph Demo Seed Data / Pilot Setup

Use this as the repeatable school/campus demo data plan until an automated Prisma seed script is added.

## Demo Account and Organization

1. Start the app with a configured Postgres database.
2. Register a demo admin at `/auth/register`.
3. Create organization: **Demo Campus School** with slug `demo-campus-school`.
4. Create building: **Demo Campus Main Building** with a public school/campus description and address.

## Floors

Create two floors:

- **Ground Floor** (`levelNumber: 0`) — Main entrance, reception, restrooms, elevator, corridor, lecture room.
- **Second Floor** (`levelNumber: 1`) — Library, office, classroom, elevator lobby, stairs landing.

## Suggested Nodes

Ground Floor:

- Main Entrance (`ENTRANCE`, searchable, accessible)
- Reception (`RECEPTION`, searchable)
- Ground Corridor Junction (`CORRIDOR_JUNCTION`)
- Ground Restrooms (`RESTROOM`, searchable)
- Elevator Ground (`ELEVATOR`, searchable, accessible)
- Stairs Ground (`STAIRCASE`, searchable)
- Lecture Room 101 (`LECTURE_HALL`, searchable, aliases: `Room 101`, `Lecture Hall`)

Second Floor:

- Elevator Second (`ELEVATOR`, searchable, accessible)
- Stairs Second (`STAIRCASE`, searchable)
- Library (`ROOM`, searchable, aliases: `Media Center`)
- Admin Office (`OFFICE`, searchable)
- Classroom 201 (`ROOM`, searchable, aliases: `Room 201`)

## Suggested Edges

- Main Entrance ↔ Reception: accessible, direction hint “Enter through the main doors and continue to reception.”
- Reception ↔ Ground Corridor Junction: accessible.
- Ground Corridor Junction ↔ Ground Restrooms: accessible.
- Ground Corridor Junction ↔ Elevator Ground: accessible.
- Ground Corridor Junction ↔ Stairs Ground: accessible false, requires stairs false.
- Ground Corridor Junction ↔ Lecture Room 101: accessible.
- Elevator Ground ↔ Elevator Second: accessible, requires elevator.
- Stairs Ground ↔ Stairs Second: requires stairs.
- Elevator Second ↔ Library: accessible.
- Elevator Second ↔ Admin Office: accessible.
- Elevator Second ↔ Classroom 201: accessible.
- Stairs Second ↔ Classroom 201: requires stairs.

## QR Demo

Generate and print QR checkpoints for:

- Main Entrance
- Reception
- Elevator Ground
- Library

Confirm generated links use `NEXT_PUBLIC_APP_URL` and the `/navigate/{buildingId}?node={checkpointCode}` format.

## Publication and Offline Demo

1. Use Route Tester to validate Main Entrance → Library in default and accessible modes.
2. Publish only after the readiness checks pass.
3. Open `/explore`, select the building, and download the offline package.
4. In browser dev tools, simulate offline mode and confirm destination search plus route calculation still work from the downloaded package.

## Known Manual Step

There is currently no automated `prisma/seed.ts`. This manual setup is the supported demo seed path for the pilot handoff.
