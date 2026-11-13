# Household Resilience

A mobile-friendly household preparedness planner for a UK family of five.

## Deployment

Connect the `MikeLNewell/resilience` GitHub repository to Netlify. No build command is required; publish directory is `.`. Configure the custom domain `resilience.newell.phd` in Netlify and follow its DNS instructions.

## Current functionality

Budget settings, a prioritised catalogue, basic purchase logging, inventory tracking, deep pantry, indicative roadmap and JSON export. All state is currently stored in the current browser's localStorage.

## Important security limitation

This is an initial prototype and is NOT private or authenticated. Do not enter personal or sensitive household data. Public deployment makes the interface accessible to anyone. Add server-side authentication and persistent storage before using it as a private household system.

## Limitations

The roadmap is illustrative, prices are estimates, readiness coverage is not a guarantee of safety, and data does not synchronise across devices. This prototype is not the complete planned React/Supabase application.
