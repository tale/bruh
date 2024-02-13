# bruh
*A drop-in replacement for `brew` on macOS.*

This is a complete 1:1 feature-parity tool of `brew`, the popular package manager used on macOS devices. This project mostly exists for fun and shouldn't be used in any sort of official capacity. Personally, I use it over `brew` when running packaging commands on my system, but proceed with caution.

## Setup/Installation
Install the latest version via [nightly.link](https://nightly.link/tale/bruh/workflows/nightly.yaml/main) or from the [Actions](https://github.com/tale/bruh/actions/workflows/nightly.yaml) tab to view older nightlies if necessary.

## Decisions
`bruh` is written purely in TypeScript and compiled into a binary using [Node.js Single Executable Applications](https://nodejs.org/api/single-executable-applications.html). This was mostly because I enjoy writing TypeScript and I wanted to prove that application design is just as important as the platform an application is built on.

Using promises, `bruh` is very fast and outperforms brew by a massive margin and most likely can outperform APT because of how the event-loop in Node.js works and concurrent tasks that I've chosen to opt into as a reliability trade-off.

The project mostly serves for my own exploration of the limitations of Node.js, macOS, and how to solve some of the issues in unique ways (such as re-elevating a non-root process, or handling authentication via PAM). However, I also aimed to solve a few of the issues that come with `brew`:
- Significantly speed up commands by removing scripts
- Remove the dependency on a local git state to track updates
- Be significantly more self-contained than the current iteration of `brew`

## Benchmarks
Coming soon-ish?

> Copyright (c) 2024 Aarnav Tale.
