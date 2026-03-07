# Python to Rust Migration: Performance & RAM Estimation - AI-Generated Report

## Context

The PAgent backend currently runs on a Raspberry Pi 400 (ARM Cortex-A72 CPU, 4GB LPDDR4-3200 RAM). Because this single node hosts MongoDB, Redis, and the FastAPI application pods, memory is at an extreme premium.

## Current Python Memory Profile (FastAPI/Uvicorn)

- **Idle Process Footprint:** Loading `fastapi`, `pydantic`, `motor`, `redis`, and especially data-heavy libraries like `pandas`, `numpy`, and `google-genai` creates an enormous base footprint. A single idle FastAPI worker typically consumes **~120MB to 180MB**.
- **Under Load:** During an active websocket session or processing an LLM response stream, memory per worker easily spikes to **250MB - 350MB+**.
- **Multi-worker Scaling:** Running 4 workers blocks out **~1GB to 1.4GB** of RAM just for the application processes, leaving very little room for MongoDB's wiredTiger cache or the OS page cache (critical for LanceDB vector searches).

## Projected Rust Memory Profile (Axum/Actix-Web & Tokio)

- **Compiled Binary vs VM:** Rust compiles to a statically linked binary. There is no interpreter or garbage collector overhead.
- **Idle Process Footprint:** A typical Rust async web server (using `axum` or `actix-web`) handling websockets and HTTP routes rests at **~10MB to 20MB** per process instance.
- **Under Load:** Because memory is freed deterministically with zero GC pauses, Rust scales incredibly well. Memory during active websocket broadcasting or concurrent requests generally stays well under **50MB**.
- **Vector DB benefits:** LanceDB has native Rust bindings. Using LanceDB in Rust instead of Python bypasses the global interpreter lock (GIL) entirely and avoids C-to-Python memory boundary copying, reducing overall CPU utilization on the ARM chip.

## Estimated Improvements

| Metric                  | FastAPI (Python)       | Axum (Rust)                         | Estimated Improvement                  |
| :---------------------- | :--------------------- | :---------------------------------- | :------------------------------------- |
| **Idle RAM (1 Worker)** | ~150 MB                | ~15 MB                              | **90% Reduction**                      |
| **Peak RAM (1 Worker)** | ~350 MB                | ~40 MB                              | **88% Reduction**                      |
| **RAM (4 Workers)**     | ~1.4 GB                | ~160 MB (or 1 multi-thread process) | **Free up ~1.2 GB RAM (-85%)**         |
| **Cold Start Time**     | ~2-3 Seconds           | < 50 Milliseconds                   | **98% Faster**                         |
| **CPU Usage (Avg)**     | Moderate (Runtime/GIL) | Extremely Low                       | **Much tighter performance on pi ARM** |

## Conclusion

A migration to Rust represents a tremendous reduction in the PAgent backend's resource footprint. Freeing up \~1.2GB of RAM would allow MongoDB and Redis to function optimally on the Pi 400, eliminating page swapping. Additionally, writing a highly concurrent system leveraging Rust's ownership model strongly fulfills your "Learning" engineering goal, as you'd tackle memory safety and multithreading in a high-performance scenario.
